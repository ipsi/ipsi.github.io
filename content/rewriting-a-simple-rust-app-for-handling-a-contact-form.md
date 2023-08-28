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

# Changing the Web Framework
Initially, I had used [Actix Web][actix] and that was fine. However, the 
last time I played around with the Web in Rust, I ended up using [Axum][axum],
so at the moment I'm a lot more familiar with that than the current state of 
Actix. Switching away from Actix also means I needed a new HTTP Client, 
which I'll cover below.

## Edition Changes
Step one was to switch to Rust's [2021 Edition][rust2021], which has a 
number of features, but in this particular case, the only major difference 
was simplifying the imports - no more `extern crate`, no more `#[macro_use]`,
I could just do `use axum::*`/etc and it would work.

[axum]: https://docs.rs/axum/latest/axum/
[reqwest]: https://docs.rs/reqwest/latest/reqwest/
[actix]: https://actix.rs/
[rust2021]: https://doc.rust-lang.org/edition-guide/rust-2021/index.html