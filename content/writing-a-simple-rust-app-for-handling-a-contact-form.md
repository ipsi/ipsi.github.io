+++
title = "Writing a simple Rust app for handling a contact form"
slug = "writing-a-simple-rust-app-for-handling-a-contact-form"
date = 2018-12-03T15:56:07.000Z
updated = 2018-12-03T15:57:54.000Z
[taxonomies]
categories = ["Technical"]
tags = ["rust"]
+++

# What and Why

At the time of writing this post, I do not have a simple "Contact Me" page on this site, making it a bit harder for anyone who wants to, to contact me.

Actually making that happen isn't as simple as it sounds, if I don't want to just publish my email address on the site (and I'd rather not make it *quite* that easy for spammers to scrape it).

So what do I do? Well, I figured I would use a service like [MailGun](https://www.mailgun.com) to send emails to my own address. I don't have any affinity to MailGun in particular - it just happened to have a free tier.

Now, MailGun requires an API key (or use of SMTP), and, again, I'm not all that keen on publishing my API key where anyone can view it - apart from anything else, it's *really* bad security practice.

So, given the requirement of "Send email by calling MailGuns API, but without publishing any secrets on this blog, either openly, or in JavaScript", I figured that I would write a simple web app to receive the contact form POST, and forward that to MailGun, keeping everything nice and secure (relatively speaking).

## Requirements

So, simply put, what do I need the app to do?

- Receive an HTML form `POST`ed over HTTP(S)
- `POST` an HTML form over HTTP(S), using the contents of the received form and some static data, like the API key and a "to" email address.
- Handle the response, and redirect the user to particular page, using an HTTP `303 See Other` response code.

That's it - this should't be hard, right?

# Writing the app

## Language choice

To start with, I had to choose a language - what would it be? GoLang would have been a good choice for this (but I don't like GoLang all that much - a topic for another post!). Java is what I would normally use, but that requires a ton of memory and ceremony that feels a bit out of place for something this simple. I could probably have used PHP, but I also don't like PHP. I find getting set up with Python and Ruby to be a pain, and I'm not terribly familiar with either of them, so I ruled those out.

I eventually settled on Rust, primarily because it's a language that I quite like, and that I want to do more with. This isn't really the best use-case for it (as we'll see soon), but it has the advantages of being easier to set up than Ruby and Python (until we get to cross-compilation), and, being a native app, it will by default consume a *lot* less memory than Java, while being about as performant, if not more so.

## Framework Choice

After making the decision to use Rust, I had to decide on a web framework. There are a few of them out there (see ["Are we web yet?" for Rust](https://www.arewewebyet.org)), and I chose [Actix Web](https://actix.rs) for a couple of reasons:

- I've read about, and played around with it, before
- It's under active development
- It uses Tokio & Futures under the hood (for non-blocking/async IO)
- It seems relatively simple to get set up with.
- It has a proper user guide, on top of API documentation.
- It includes an HTTP client as well as an HTTP server

The other choice I would likely have made would have been [Rocket](https://rocket.rs), as it seems to be the most mature.

However, for this application, I definitely wanted a non-blocking framework, as 99% of the work will be receiving data, sending data, and waiting for a response.

## Getting started

Before we get started, you can find the finished application on [GitHub](https://github.com/ipsi/mailgun-contact-form/)

### Dependencies

A quick note on dependencies - our `Cargo.toml` file looks like this

```toml
...
[dependencies]
actix-web = { version="0.7", features=["rust-tls"] }
futures = "0.1"
serde = "1.0"
serde_derive = "1.0"
serde_urlencoded = "0.5"
base64 = "0.10"
lazy_static = "1.2"
env_logger = "0.6"
log = "0.4"
url = "1.7"
```
We're using Actix Web, so we obviously pull that in. We need the Futures crate so we can directly use Futures in our code. Serde is used to handle the serialization and deserialization of our Form structs. Base64 is needed for encoding our HTTP basic authentication, Env Logger and Log for logging, and URL for doing basic URL encoding of strings.

#### Enabling TLS for client and server

Note that `actix-web` has a feature flag enabled, of `rust-tls` - as Mailgun exposes their API over HTTPS, we need to make sure our client is TLS-enabled, which it isn't by default. Our options are one of:

- `tls`
- `ssl`
- `rust-tls`

Our ultimate deployment target is Linux (see last section), so using `tls` or `ssl` would involve pulling in `OpenSSL`, and that's a nightmare to build into a statically-compiled binary with MUSL (see my other post [here](__GHOST_URL__/cross-compiling-a-simple-rust-web-app) for more on that!). A far, far easier option is to use `rust-tls`, which is a pure-Rust implementation of the most modern parts of TLS.

### Starting the server

To get started with the application, we need to start with a main function, and a handler:

```rust
fn send_form(req: Form<FormData>) -> Result<Box<Future<Item = impl Responder, Error = ResponseError>>, actix_web::Error> {
    futures::finished(HttpResponse::build(StatusCode::NO_CONTENT).finish())
}

const DEFAULT_PORT: &'static str = "8088";
const DEFAULT_BIND_ADDRESS: &'static str = "0.0.0.0";

fn main() -> Result<(), Box<Error>> {
    let bind_address = std::env::var("BIND_ADDRESS").unwrap_or(DEFAULT_BIND_ADDRESS.to_string());
    let port = std::env::var("PORT").unwrap_or(DEFAULT_PORT.to_string());

    info!("Binding to {}:{}", bind_address, port);

    server::new(|| App::new().route("/", http::Method::POST, send_form))
        .bind(format!("{}:{}", &bind_address, &port))?
        .run();

    Ok(())
}
```

This will create a handler for any request to `/` (and `/` only!), expecting to receive `POST` requests whose body is a `application/x-www-form-urlencoded` form (e.g. from an HTML `<form>`), and return a `204` response, since we're not returning any actual content.

## Using the client

### Creating & sending a request

One of the reasons for choosing Actix Web was that in includes an HTTP client by default. Unfortunately, this client is *not* well-documented, and it was a bit frustrating to use, and to figure out how it interacted with the server, particularly in terms of return types.

The first thing we should do is create a client, and send a request.

```rust
client::post(HOST.as_str())
    .header("Authorization", AUTH_HEADER.as_str())
    .header("Content-Type", "application/x-www-form-urlencoded")
    .form(&data)?
    .send()
```
Note that `header` is defined as

```rust
pub fn header<K, V>(&mut self, key: K, value: V) -> &mut Self
where
    HeaderName: HttpTryFrom<K>,
    V: IntoHeaderValue,
```
So both the header name and value need to meet certain requirements - namely, it must be possible to convert the type of the header name into a `HeaderName` struct, and there must be an implementation of `IntoHeaderValue` for the type of the value. This is the case for `&str`, but *not *for `String`, hence the conversion of `AUTH_HEADER`.

Sending the body is, for us, fairly simple - the `form()` method will convert anything which implements `serde::ser::Serialize` into an `application/x-www-form-urlencoded`-compatible string. In our case, we have the simple `struct`

```rust
#[derive(Serialize)]
struct MailGunData<'a> {
    from: &'a str,
    to: &'a str,
    subject: &'a str,
    text: &'a str,
}
```
Which has a derived serialisation method.

There are other alternatives, such as

- `json`
- `body`
- `streaming`

`json` is much the same as `form` (both require Serde), while `body` takes any of binary data, streaming data, or an Actix Actor. `streaming` would be used where you don't want to store the entire body in-memory.

Calling any of the previous functions ( `json`, `body`, `form`, `streaming`) will build the `ClientRequest`, ready for sending.

### Handling the response

Calling `send()` creates a `SendRequest` struct – this implements `Future`, and that's the primary way to interact with it. In our case

```rust
.from_err::<ResponseError>()
.and_then(|resp| {
    info!("Received response with status {}", resp.status());
    return if resp.status().is_success() {
        Either::A(create_ok_response())
    } else if resp.status() == StatusCode::UNAUTHORIZED { // Doesn't return a JSON response on a 401...
        error!("Received a 401 error trying to call MailGun...");
        let f = resp.body().and_then(|raw_body| {
            let body = String::from_utf8_lossy(raw_body.as_ref()).to_string();
            create_err_response(&body)
        }).from_err();
        Either::B(Either::A(f))
    } else {
        let f = resp.json().from_err::<ResponseError>().and_then(|body: MailGunErrorResponse| {
            error!("Received an error from MailGun: {}", body.message);
            create_err_response(&body.message)
        }).from_err();
        Either::B(Either::B(f))
    }
})
.or_else(|err: ResponseError| {
    error!("Received an error processing the request: {}", err);
    create_err_response(err.description())
})
```
`ResponseError` is a `struct` defined earlier in the file (implementations elided)

```rust
#[derive(Debug)]
struct ResponseError(String);

impl Error for ResponseError { ... }

impl std::fmt::Display for ResponseError { ... }

impl actix_web::ResponseError for ResponseError { ... }

impl From<PayloadError> for ResponseError { ... }

impl From<SendRequestError> for ResponseError { ... }

impl From<JsonPayloadError> for ResponseError { ... }
```
#### Error Conversion

The first thing we have to do is apply a conversion for any errors we get out of the response, otherwise our life will be quite awkard - we would be trying to return multiple different error types from this function.

As a quick aside, we have defined a custom error type because it's not possible to convert between `SendRequestError` and `PayloadError` (or any of the other error types we'll encounter), and it doesn't seem that there's a conversion defined for `Box<Error>`.

For example, `SendRequest` has an associated error type of `SendRequestError` so if we don't call `from_err`, and just call `and_then` directly, the closure passed to `and_then` would be expected to return `IntoFuture<Error = Self::Error>`, or, in this case `IntoFuture<Error = SendRequestError>`. So if our closure were to call something like `resp.body()...` (ignoring all the other errors we'd get)

```rust
.and_then(|resp| {
    resp.body().and_then(|body| {
        futures::finished(body)
    })
}
```
It would be expecting the closure to return `IntoFuture<Bytes, SendRequestError>`, but we're returning an `FutureResult<Bytes, PayloadError>`.  `IntoFuture` is a `trait`, and it's been implemented for `FutureResult` so we can happily return a `FutureResult` here – *provided* the generic types match, which they don't.

Whereas if we add a `.from_err::<ResponseError>()` call before the outer-most `and_then`, like so

```rust
.from_err::<ResponseError>()
.and_then(|resp| {
    resp.body().and_then(|body| {
        futures::finished(body)
    })
})
```
This changes things, as the `from_err()` returns a `FromErr<Self, E>`, or `FromErr<ClientResponse, ResponseError>` in our case. Since we have the `impl` block `impl From<SendRequestError> for ResponseError`, it'll automatically convert that for us. In addition, as `FromErr` implements `Future`, it also, effectively, returns `Future<ClientResponse, ResponseError>`.

So now we can call `and_then` on our `FromErr`, and it's expecting the closure to return a `FutureResult<Bytes, ResponseError>`, but it's actually returning a `FutureResult<Bytes, PayloadError>`.

Again, there's a simple enough fix here – we just have to add another call to `.from_err()`, either after calling `body()`, like `resp.body().from_err()`, or after calling `and_then()`, like `resp.body().and_then(...).from_err()`.

It doesn't matter where we put it, as the closure in the `and_then` call never returns an error, and thus doesn't ever change the error type.

If, on the other hand, we change the type of the error in the `and_then` closure, like so

```rust
impl From<Box<dyn Error>> for ResponseError { ... }

resp.body().from_err().and_then(|body| {
    if body.binary_search(&0).unwrap() == 1 {
        futures::finished::<Bytes, Box<dyn Error>>(body)
    } else {
        let err: Box<dyn Error> = From::from("I'm an error!");
        futures::failed::<Bytes, Box<dyn Error>>(err)
    }
})
```
Then, initially, we get a really strange error, stating (amongst other things)

```
error[E0277]: the trait bound `actix_web::error::PayloadError: std::error::Error` is not satisfied                                                                                                                                       
   --> src/main.rs:203:57                                                                                                                                                                                                                
    |                                                                                                                                                                                                                                    
203 |             resp.body().from_err().and_then(|body| {                                                                                                                                                          
    |                                    ^^^^^^^^ the trait `std::error::Error` is not implemented for `actix_web::error::PayloadError`                                                                             
    |                                                                                                                                                                                                                                    
    = note: required because of the requirements on the impl of `std::convert::From<actix_web::error::PayloadError>` for `std::boxed::Box<dyn std::error::Error>`                                                                        
    = note: required because of the requirements on the impl of `futures::Future` for `futures::future::FromErr<actix_web::dev::MessageBody<actix_web::client::ClientResponse>, std::boxed::Box<dyn std::error::Error>>` 
```
This isn't actually the error I was expecting, by the way!

It appears the reason for this is that the compiler has inferred the return type of `from_err()` as `FromErr<Box<Error>>` – which makes sense, as that's what we're returning from the closure. The issue here, though, is that `PayloadError` doesn't implement the trait `Error`, so we can't covert from `PayloadError` to `Box<Error>` – `Box<Error>` only has conversions defined for very generic types. OK, that makes sense!

We can get a step further by explicitly telling `from_error` which type we're converting our errors to, like so

```rust
resp.body().from_err::<ResponseError>().and_then(|body| {
    if body.binary_search(&0).unwrap() == 1 {
        futures::finished::<Bytes, Box<dyn Error>>(body)
    } else {
        let err: Box<dyn Error> = From::from("I'm an error!");
        futures::failed::<Bytes, Box<dyn Error>>(err)
    }
})
```
This gives us another error message, this time looking like

```
error[E0271]: type mismatch resolving `<futures::FutureResult<bytes::Bytes, std::boxed::Box<dyn std::error::Error>> as futures::IntoFuture>::Error == ResponseError`                                                                     
   --> src/main.rs:203:53                                                                                                                                                                                                                
    |                                                                                                                                                                                                                                    
203 |             resp.body().from_err::<ResponseError>().and_then(|body| {                                                                                                                                                              
    |                                                     ^^^^^^^^ expected struct `std::boxed::Box`, found struct `ResponseError`                                                                                                       
    |                                                                                                                                                                                                                                    
    = note: expected type `std::boxed::Box<dyn std::error::Error>`                                                                                                                                                                       
               found type `ResponseError` 
```
This is because, when we call `and_then()`, the value it returns has the same Error type as the previous struct/trait, which in this case is `FromErr<Self, ResponseError>`, so our only choice in this situation is to return a `ResponseError` – in all other cases, the compiler *will* complain. We can't put a `from_err()` after the `and_then()` call because the restriction is on the return type of the closure passed to `and_then()`.

### Sending the response

Creating a response is fairly straightforward – your handler function *must* return something that implements the `Into<Responder>`. Two of the most relevant implementions are

```rust
impl<T: Responder, E: Into<Error>> Responder for Result<T, E> { ... }
impl<I, E> Responder for Box<Future<Item = I, Error = E>>
where
    I: Responder + 'static,
    E: Into<Error> + 'static,
{
    ...
}
```
In the first instance, if your handler function returns `Result<T, E>`, then as long as `E` can be converted into an `Error`, either because it implements the trait, or because there's an `impl Into<Error>` for it, and as long as `T` implements `Responder` directly, you'll have no issues.

For our purposes, our `ResponseError` struct has an impl of `Error`, `impl Error for ResponseError { ... }`, and we are returning the struct `HttpResponse`, which implements `Responder`.

However, if we *just* want to return `Result<HttpResponse, ResponseError>`, then we have to resolve the futures ourselves. That's rather annoying, so that's where the second `impl` mentioned earlier comes into play.

Since `Box<Future<I, E>>`*also* implements `Responder`, we can return a Future from our handler function, and Actix will resolve that for us. Easy!

Hence, the signature for the return type for our handler function is `Result<Box<Future<Item = impl Responder, Error = ResponseError>>, actix_web::Error>`.

Breaking that down, we will return either an `actix_web::Error` if the function fails to even make it into the Futures-chain (this can only happen if `.form(&data)?` returns an `Err`), or we return a Boxed Future, which resolves to *something* that implements `Responder`, or it resolves to a `ResponseError`. Thankfully, we can use `impl Responder` here, as otherwise the type signature would be a bit... awful.

```rust
OrElse<
    AndThen<
        FromErr<
            SendRequest,
            ResponseError
        >,
        Either<
            FutureResult<
                HttpResponse,
                ResponseError
            >,
            Either<
                FromErr<
                    AndThen<
                        MessageBody<
                            ClientResponse
                        >,
                        FutureResult<
                            HttpResponse,
                            error::PayloadError
                        >,
                        [closure@src/main.rs:200:46: 203:18]
                    >,
                    ResponseError
                >,
                FromErr<
                    AndThen<
                        FromErr<
                            JsonBody<
                                ClientResponse,
                                MailGunErrorResponse
                            >,
                            ResponseError
                        >,
                        FutureResult<
                            HttpResponse,
                            ResponseError
                        >,
                        [closure@src/main.rs:206:74: 209:18]
                    >,
                    ResponseError
                >
            >
        >,
        [closure@src/main.rs:194:19: 212:10]
    >,
    FutureResult<
        HttpResponse,
        ResponseError
    >,
    [closure@src/main.rs:213:18: 216:10]
>
```
All of that can be replaced with `Item = impl Responder`.

In any event, the actual response that's being sent back is simple – create a `ResponseBuilder` and set the `Location` header to the URL we're redirecting the user to. If the request to Mailgun was successful, the redirect includes a URL param of `status=success`, otherwise it includes two URL params, being `status=error&message=...`, where `message` is whatever was returned to us either by Actix, Serde, or Mailgun, depending on where the error occurred.

### `futures::Either`

Note the uses of

```rust
Either::A(create_ok_response())
Either::B(Either::A(f))
Either::B(Either::B(f))
```
In the three different `if` branches - because each of them returns a different type (the first one doesn't a body, while the second takes the body as string, and the third converts the body to JSON – hence none of them have the same type signature), we need some way to sharing the type signature. This is what `futures::Either` lets us do - it's an `enum` that says "we could return *either* of these future types – if you want to know which, you'll have to `match` on the return value" – *provided* they all have the same `Item` and `Error` types.

It's possible this can be done just by using `Box`es, but it wasn't obvious to me how to make all the different types play nicely together!

You can also nest these ever-more deeply if required

```rust
Either::A(Either::A(Either::A(f)))
Either::A(Either::A(Either::B(f)))
Either::A(Either::B(Either::A(f)))
Either::A(Either::B(Either::B(f)))
Either::B(Either::A(Either::A(f)))
Either::B(Either::A(Either::B(f)))
Either::B(Either::B(Either::A(f)))
Either::B(Either::B(Either::B(f)))

Either::A(Either::A(Either::A(Either::A(f))))
.
.
.
```
Though nesting them more than one level deep will drive you completely batty very quickly, and is *not* recommended (nesting them *at all* isn't really recommended).

## Deployment

Now that the application has been written, how do we deploy it?

In my case, I will be deploying it to [PWS](https://run.pivotal.io), because I work for Pivotal and have a small amount of free credit to use on the platform. This is built around Linux containers, much like [Heroku](https://www.heroku.com).

This means a few main things for us

- We want to compile an `x86_64` binary, statically compiled, for Linux
- PWS handles SSL termination, so we don't have to worry about that in the application
- The simplest way to handle secrets in PWS is to pass them in as environment variables (there are other options, but this is by far the quickest)

The hardest part about this is cross-compiling. Once the binary builds, it deploys without issue! See my [other guide](__GHOST_URL__/cross-compiling-a-simple-rust-web-app-2) for instructions on cross-compiling the binary, what steps are required, and *why* they're required.

Once you have a cross-compiled binary, deploying it is simple

```bash
export VARS_FILE="<vars_file_here>.yml"
cf push --vars-file "${VARS_FILE}"
```
The `VARS_FILE` must look something like this

```bash
MAILGUN_API_KEY: "<api_key>"
MAILGUN_DOMAIN: "<mailgun_domain>"
MAILGUN_TO_ADDRESS: "Name <email@domain.com>"
MAILGUN_REDIRECT_URL: "https://...."
```
Presto! You now have a working application, which you can test with a simple cURL command

```bash
curl -v \
    -XPOST \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -d 'from_name=Test User' \
    -d 'from_email=user@domain.com' \
    -d 'title=A test' \
    -d 'body=a body' \
    https://<deployed_url>
```
This will return a response along the lines of

```
* upload completely sent off: 70 out of 70 bytes
< HTTP/1.1 303 See Other
< Date: Mon, 03 Dec 2018 15:52:42 GMT
< Location: https://<redirect_url>?status=success
< Content-Length: 0
< Connection: keep-alive
< 
* Connection #0 to host <deployed_url> left intact
```