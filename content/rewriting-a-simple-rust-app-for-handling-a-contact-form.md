+++
title = "\"Modernising\" my contact form app"
slug = "modernising-contact-form-app"
date = 2023-08-29T00:55:07.000Z
draft = true
[taxonomies]
categories = ["Technical"]
tags = ["rust"]
+++

# What and Why

When I initially launched this blog, I wanted to keep my email address 
private, so I wrote a relatively simple Rust app that would accept a request 
with some form data in it, and forward that long to Mailgun, which would in 
turn send me an email. Very simple. You can read about the [process of 
writing it](/writing-a-simple-rust-app-for-handling-a-contact-form), and my 
adventures in [trying to cross-compile it](cross-compiling-a-simple-rust-web-app).

In the years since, the Rust ecosystem has advanced *significantly*, 
particularly with the addition of the (somewhat controversial) `async` 
keyword, and the creation of the [Axum][axum] and [Reqwest][reqwest] crates.

So, since I'm already updating and fiddling with my blog, I figured I'd have 
a look and see what I needed to do to bring this little app up-to-date with 
Rust in 2023. As it turns out, it was really, really easy.

# Changes

## Edition Changes
Step one was to switch to Rust's [2021 Edition][rust2021], which has a
number of features, but in this particular case, the only major difference
was simplifying the imports - no more `extern crate`, no more `#[macro_use]`,
I could just do `use axum::*`/etc and it would work.

Rust also now expects (I _think_ as part of the edition change) that Trait 
references now include the prefix `dyn` - e.g., `Box<dyn Error>`.

## Changing the Web Framework
Initially, I had used [Actix Web][actix] and that was fine. However, the
last time I played around with the Web in Rust, I ended up using [Axum][axum],
so at the moment I'm a lot more familiar with that than the current state of
Actix. Switching away from Actix also means I needed a new HTTP Client,
which I'll cover below.

There were a few changes that had to be made, none of them complex. First, 
Actix Web either didn't use Tokio, or created it behind the scenes. With 
Axum, it expects to be running in a Tokio runtime. Given the simplicity of 
this application, all we need is to add `#[tokio::main]` to `main` and mark 
it as `async`:

```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // ...
}
```

Axum is also instantied slightly differently. Actix has an `App` which 
routes, middleware, etc, are added to, and is then bound and started. Axum 
rather creates a `Router` object, and serves the app, like so:

```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // ...

    let app = Router::new().route("/", post(send_form));

    axum::Server::bind(&format!("{}:{}", bind_address, port).parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
```

Compare with Actix:

```rust
fn main() -> Result<(), Box<Error>> {
    // ...

    server::new(|| App::new().middleware(Logger::default()).route("/", http::Method::POST, send_form))
        .bind(format!("{}:{}", &bind_address, &port))?
        .run();

    Ok(())
}
```

The differences at this stage are fairly minimal.

Things start to change a lot more when we look at the actual handler method. 
A major part of this is because the version of Actix used wasn't `async` 
aware, so everything had to be done via `future`-chaining, and the types 
were a lot more explicit.

Axum has also simplified the setup significantly by providing a number of 
_extremely_ helpful implementations of `IntoResponse` for common situations, 
like returning a tuple of `(StatusCode, String)`, or `(StatusCode, JSON)`, etc.

It also happily handles `Result` types, such as `Result<impl IntoResponse, 
MyError>`, assuming that `MyError` implements `IntoResponse` itself.

Comparing just the Axum signature:

```rust
async fn send_form(Form(req): Form<FormData>) -> Result<impl IntoResponse, ContactFormError> {
    // ...
}
```

with Actix:

```rust
fn send_form(req: Form<FormData>) -> Result<Box<Future<Item = impl Responder, Error = ResponseError>>, actix_web::Error> {
    // ...
}
```

We can already see that Axum is easier to follow, with the slight 
qualification that it's not obvious _exactly_ what it can return, just that 
it will be something that can be converted to a `Response` (or an error).

At this stage, we also have a `ResponseError` struct, used for returning an 
error message as a string. The standard Rust approach is generally to use an 
Enum for errors, so let's do that, and rename it to `ContactFormError` in 
the process. We've only got a single error, from Reqwest, so the definition 
is very simple:

```rust
enum ContactFormError {
    MailGunError(reqwest::Error),
}
```

### Axum Type Errors

However, Axum will complain that it doesn't implement `Handler`:

```
error[E0277]: the trait bound `fn(Form<FormData>) -> impl Future<Output = Result<impl IntoResponse, ContactFormError>> {send_form}: Handler<_, _, _>` is not satisfied
   --> src\main.rs:166:45
    |
166 |     let app = Router::new().route("/", post(send_form)).layer(cors);
    |                                        ---- ^^^^^^^^^ the trait `Handler<_, _, _>` is not implemented for fn item `fn(Form<FormData>) -> impl Future<Output = Result<impl IntoResponse, ContactFormError>> {send_form}`
    |                                        |
    |                                        required by a bound introduced by this call
    |
    = help: the following other types implement trait `Handler<T, S, B>`:
              <Layered<L, H, T, S, B, B2> as Handler<T, S, B2>>
              <MethodRouter<S, B> as Handler<(), S, B>>
note: required by a bound in `post`
   --> C:\Users\nzips\.cargo\registry\src\index.crates.io-6f17d22bba15001f\axum-0.6.20\src\routing\method_routing.rs:407:1
    |
407 | top_level_handler_fn!(post, POST);
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ required by this bound in `post`
    = note: this error originates in the macro `top_level_handler_fn` (in Nightly builds, run with -Z macro-backtrace for more info)
```

This is a surprisingly nasty error, and, worse, it's not where you'd 
initially hope to see it - it's where the handler is added to the router, 
not where it's defined.

The specific part of the error that we care about is this:

```
---- ^^^^^^^^^ the trait `Handler<_, _, _>` is not implemented for fn item ...
```

A bit of digging tells us that `axum::handler::Handler` is defined like so:

```rust
pub trait Handler<T, S, B = Body>: Clone + Send + Sized + 'static { ... }
```

and that there's an `impl` block for it like this:

```rust
impl<F, Fut, Res, S, B> Handler<((),), S, B> for F
where
    F: FnOnce() -> Fut + Clone + Send + 'static,
    Fut: Future<Output = Res> + Send,
    Res: IntoResponse,
    B: Send + 'static,
{ ... }
```

Taken together, `Handler` is implemented for any `FnOnce` that returns a 
`Future` provided that `Future` returns something that implements 
`IntoResponse`. OK, great.

Looking at our error message, we know:

* It's failing to convert our function to a `Handler`
* Our function is `async` so it's returning a `Future` (under the hood)
* The `Future` is outputting a `Result` - does that have an `IntoResponse` 
  implementation?

With some more digging, we will [see that](https://docs.rs/axum/latest/axum/response/trait.IntoResponse.html#impl-IntoResponse-for-Result%3CT,+E%3E)
`IntoResponse` has an implementation for `Result`, like this:

```rust
impl<T, E> IntoResponse for Result<T, E>
where
    T: IntoResponse,
    E: IntoResponse,
{ ... }
```

Which is the source of our error - the function return type is `Result<impl 
IntoResponse, ContactFormError>`, and the `Ok` arm obviously implements 
`IntoResponse`, but the `ContactFormError` does *not*.

### `#[axum::debug_handler]`
The above process was somewhat painful and if you didn't already know where 
to look, it could have taken quite a while to figure it out. Fortunately, 
Axum provides a macro you can add to handler functions to improve the error 
output they generate. First, `axum` needs to be added with the `macros` 
feature enabled in `Cargo.toml`:

```toml
axum = { version = "0.6", features=["macros"] }
```

then, the function definition becomes this:

```rust
#[axum::debug_handler]
async fn send_form(Form(req): Form<FormData>) -> Result<impl IntoResponse, ContactFormError> { ... }
```

and the error output is now this

```
error[E0277]: the trait bound `ContactFormError: IntoResponse` is not satisfied
   --> src\main.rs:104:50
    |
104 | async fn send_form(Form(req): Form<FormData>) -> Result<impl IntoResponse, ContactFormError> {
    |                                                  ^^^^^^ the trait `IntoResponse` is not implemented for `ContactFormError`
    |
    = help: the following other types implement trait `IntoResponse`:
              &'static [u8; N]
              &'static [u8]
              &'static str
              ()
              (T1, R)
              (T1, T2, R)
              (T1, T2, T3, R)
              (T1, T2, T3, T4, R)
            and 123 others
    = note: required for `Result<impl IntoResponse, ContactFormError>` to implement `IntoResponse`
note: required by a bound in `__axum_macros_check_send_form_into_response::{closure#0}::check`
   --> src\main.rs:104:50
    |
104 | async fn send_form(Form(req): Form<FormData>) -> Result<impl IntoResponse, ContactFormError> {
    |                                                  ^^^^^^ required by this bound in `check`
```

It is now _very_ clear what the issue is - `the trait IntoResponse is not 
implemented for ContactFormError`. Much, much quicker.

### Implementing `IntoResponse` for `ContactFormError`
Actually implementing it is very straight-forward:

```rust
impl IntoResponse for ContactFormError {
    fn into_response(self) -> Response {
        match self {
            ContactFormError::MailGunError(e) => {
                error!("Error sending mail: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, Json(ResponseData { status: ResponseStatus::InternalError, message: Some(format!("{}", e)) })).into_response()
            }
        }
    }
}
```

It needs to return a `Response` object, and as noted in [the documentation](https://docs.rs/axum/latest/axum/response/trait.IntoResponse.html),

> its often easiest to implement `IntoResponse` by calling other implementations

So that's just what we do - we create a tuple with the status code and 
message body, and then call `.into_response()` on the tuple.

### Error-handling Tidy Up

Error-handling is now solved as far as Axum goes, at least in this example, 
so we can ditch all the other impls for `ResponseError` - they're not necessary.

We can also ditch `create_ok_response` and `create_err_response`, neither of 
which are necessary with the current design of the system.

### CORS
In the original version of this, we relied entirely on the standard HTTP 
Form functionality, and then handled things server-side inform the user if 
there was an error or not. As that's no longer possible, we use JavaScript 
to send the form if it's enabled.

That, then, means we need to return valid [CORS][CORS] (Cross-Origin 
Resource Sharing) headers and respond to `OPTIONS` requests, otherwise 
browsers get _very_ grumpy. This is thankfully quite simple in Axum - we 
pull in [Tower][tower], and do the following when building the `Router` to 
add a `Layer` to handle CORS:

```rust
use tower_http::cors::{Any, CorsLayer};

// ...

let cors = CorsLayer::new()
    // allow `GET` and `POST` when accessing the resource
    .allow_methods([Method::GET, Method::POST])
    // allow requests from any origin
    .allow_origin(Any);

let app = Router::new().route("/", post(send_form)).layer(cors);
```

## Changing 

[axum]: https://docs.rs/axum/latest/axum/
[reqwest]: https://docs.rs/reqwest/latest/reqwest/
[actix]: https://actix.rs/
[rust2021]: https://doc.rust-lang.org/edition-guide/rust-2021/index.html
[tower]: https://docs.rs/tower/latest/tower/
[CORS]: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS