+++
title = "Cross-compiling a simple Rust web app"
slug = "cross-compiling-a-simple-rust-web-app"
date = 2018-12-03T15:57:29.000Z
updated = 2018-12-03T15:57:29.000Z
#tags = "rust, technical, #Import 2022-12-14 19:23"
+++
As I mentioned in another post, I wrote a simple Rust app to handle the posting of a simple contact form from this blog. If you're looking for a simple set of instructions, check the [conclusion](#conclusion) - but be aware that you might need to read the rest of the post to understand *why* these things are needed.

Writing the app itself wasn't too hard, and I managed to get it working with only minor issues (the biggest issue was noticing that I only had my IP address from my previous ISP whitelisted with Mailgun!)

However, when it came time to deploy it, I ran into some major issues:

- I was deploying to [PWS](https://run.pivotal.io), because I work for Pivotal and have a small amount of free credit to use on the platform.
- PWS is a hosted version of [Pivotal Application Service](https://pivotal.io/platform/pivotal-application-service) (PAS)
- PAS runs all applications on a Linux container (by default - there is Windows support, but I'm not interested in that)
- PAS builds and supports the container itself - I can't install any `deb` files on it, for example.
- This means that I need to build a statically-linked binary
- I'm doing development on macOS, so I need to cross-compile. If possible, I want to be able to do *everything* on macOS directly - I don't want to have to boot a Linux VM just to "cross-compile", for example.

So what do I do? Well, there has been a bit written about cross-compiling Rust [here](https://chr4.org/blog/2017/03/15/cross-compile-and-link-a-static-binary-on-macos-for-linux-with-cargo-and-rust/) and [here](http://timryan.org/2018/07/27/cross-compiling-linux-binaries-from-macos.html), for example, so let's give that a go!

## Notes

This was initially done with the dependency line `actix-web = { version="0.7", features=["ssl"] }`, which will be important later on. Note that it's *not* the same `feature` that I use in my other post, for reasons that should become apparant.

## Target

We have a choice between `x86_64-unknown-linux-gnu` and `x86_64-unknown-linux-musl`.

The former is the GNU compiler, targeting the [GNU C library](https://www.gnu.org/software/libc/), `glibc`, and only supports (AFAIK) dynamic linking – I'm unsure if this a fundamental limition of how `glibc` is compiled/designed, or if it's a licencing issue (or similar). In any event, because of our deployment requirements, we need to build a statically-linked binary, for which we should be using `x86_64-unknown-linux-musl` – this uses the [MUSL `libc`](https://www.musl-libc.org), which was designed from the ground up to be (a) compatible with  `glibc`, and (b) to support static linking.

So the first thing we need to do is install our target

```bash
rustup target add x86_64-unknown-linux-musl
```
## Compiling

### First Attempt

OK, now that we've chosen and installed our target, let's run the build against that target with `cargo build --release --target=x86_64-unknown-linux-musl`

```
error: failed to run custom build command for `backtrace-sys v0.1.24`
process didn't exit successfully: `/Users/ipsi/workspace/mailgun-contact-form/target/release/build/backtrace-sys-12a3dac99ded15c9/build-script-build` (exit code: 101)
--- stdout
TARGET = Some("x86_64-unknown-linux-musl")
OPT_LEVEL = Some("3")
HOST = Some("x86_64-apple-darwin")
CC_x86_64-unknown-linux-musl = None
CC_x86_64_unknown_linux_musl = None
TARGET_CC = None
CC = None
CROSS_COMPILE = None
CFLAGS_x86_64-unknown-linux-musl = None
CFLAGS_x86_64_unknown_linux_musl = None
TARGET_CFLAGS = None
CFLAGS = None
DEBUG = Some("false")
running: "musl-gcc" "-O3" "-ffunction-sections" "-fdata-sections" "-fPIC" "-m64" "-static" "-I" "src/libbacktrace" "-I" "/Users/ipsi/workspace/mailgun-contact-form/target/x86_64-unknown-linux-musl/release/build/backtrace-sys-4d856653fde87a65/out" "-fvisibility=hidden" "-DBACKTRACE_ELF_SIZE=64" "-DBACKTRACE_SUPPORTED=1" "-DBACKTRACE_USES_MALLOC=1" "-DBACKTRACE_SUPPORTS_THREADS=0" "-DBACKTRACE_SUPPORTS_DATA=0" "-DHAVE_DL_ITERATE_PHDR=1" "-D_GNU_SOURCE=1" "-D_LARGE_FILES=1" "-Dbacktrace_full=__rbt_backtrace_full" "-Dbacktrace_dwarf_add=__rbt_backtrace_dwarf_add" "-Dbacktrace_initialize=__rbt_backtrace_initialize" "-Dbacktrace_pcinfo=__rbt_backtrace_pcinfo" "-Dbacktrace_syminfo=__rbt_backtrace_syminfo" "-Dbacktrace_get_view=__rbt_backtrace_get_view" "-Dbacktrace_release_view=__rbt_backtrace_release_view" "-Dbacktrace_alloc=__rbt_backtrace_alloc" "-Dbacktrace_free=__rbt_backtrace_free" "-Dbacktrace_vector_finish=__rbt_backtrace_vector_finish" "-Dbacktrace_vector_grow=__rbt_backtrace_vector_grow" "-Dbacktrace_vector_release=__rbt_backtrace_vector_release" "-Dbacktrace_close=__rbt_backtrace_close" "-Dbacktrace_open=__rbt_backtrace_open" "-Dbacktrace_print=__rbt_backtrace_print" "-Dbacktrace_simple=__rbt_backtrace_simple" "-Dbacktrace_qsort=__rbt_backtrace_qsort" "-Dbacktrace_create_state=__rbt_backtrace_create_state" "-Dbacktrace_uncompress_zdebug=__rbt_backtrace_uncompress_zdebug" "-o" "/Users/ipsi/workspace/mailgun-contact-form/target/x86_64-unknown-linux-musl/release/build/backtrace-sys-4d856653fde87a65/out/src/libbacktrace/alloc.o" "-c" "src/libbacktrace/alloc.c"

--- stderr
thread 'main' panicked at '

Internal error occurred: Failed to find tool. Is `musl-gcc` installed?

', /Users/ipsi/.cargo/registry/src/github.com-1ecc6299db9ec823/cc-1.0.25/src/lib.rs:2260:5
note: Run with `RUST_BACKTRACE=1` for a backtrace.

warning: build failed, waiting for other jobs to finish...
error: build failed
```

Um. Hmm. That looks bad. `error: build failed` definitely looks bad.

The primary issue here is towards the end of that output, and is the line

```
Internal error occurred: Failed to find tool. Is `musl-gcc` installed?
```
So what's happened is that it's looking for the binary `musl-gcc`, but it can't find it. Oh no!

When on macOS, you can sometimes just do `brew install <missing_binary>`, and everything will be OK. Let's try that

```bash
$ brew install musl-gcc
Error: No available formula with the name "musl-gcc"
```
OK, I guess not?

As it turns out, there is a a Homebrew tap available at `[filosottile/musl-cross/musl-cross](https://github.com/FiloSottile/homebrew-musl-cross)` - it's not available by default, as per [this pull request](https://github.com/Homebrew/homebrew-core/pull/2974), but it's simple enough to install

```bash
brew install filosottile/musl-cross/musl-cross
```
This provides us with a `musl-gcc` binary that runs on macOS and provides output for Linux - it's built from [richfelker/musl-cross-make](https://github.com/richfelker/musl-cross-make), which in turns builds (and patches) `musl`.

So we're good now - we have our `musl-gcc` command, right?

Well... no. In order to provide broad support for multiple targets, all the commands are prefixed with `x86_64-linux-musl-`, so it's actually `x86_64-linux-musl-gcc`, but that's OK - it's fairly easy to deal with.

### Second Attempt

Having installed the command, let's try again!

```
error: failed to run custom build command for `backtrace-sys v0.1.24`
process didn't exit successfully: `/Users/ipsi/workspace/mailgun-contact-form/target/release/build/backtrace-sys-12a3dac99ded15c9/build-script-build` (exit code: 101)
--- stdout
TARGET = Some("x86_64-unknown-linux-musl")
OPT_LEVEL = Some("3")
HOST = Some("x86_64-apple-darwin")
CC_x86_64-unknown-linux-musl = None
CC_x86_64_unknown_linux_musl = None
TARGET_CC = None
CC = None
CROSS_COMPILE = None
CFLAGS_x86_64-unknown-linux-musl = None
CFLAGS_x86_64_unknown_linux_musl = None
TARGET_CFLAGS = None
CFLAGS = None
DEBUG = Some("false")
running: "musl-gcc" "-O3" "-ffunction-sections" "-fdata-sections" "-fPIC" "-m64" "-static" "-I" "src/libbacktrace" "-I" "/Users/ipsi/workspace/mailgun-contact-form/target/x86_64-unknown-linux-musl/release/build/backtrace-sys-4d856653fde87a65/out" "-fvisibility=hidden" "-DBACKTRACE_ELF_SIZE=64" "-DBACKTRACE_SUPPORTED=1" "-DBACKTRACE_USES_MALLOC=1" "-DBACKTRACE_SUPPORTS_THREADS=0" "-DBACKTRACE_SUPPORTS_DATA=0" "-DHAVE_DL_ITERATE_PHDR=1" "-D_GNU_SOURCE=1" "-D_LARGE_FILES=1" "-Dbacktrace_full=__rbt_backtrace_full" "-Dbacktrace_dwarf_add=__rbt_backtrace_dwarf_add" "-Dbacktrace_initialize=__rbt_backtrace_initialize" "-Dbacktrace_pcinfo=__rbt_backtrace_pcinfo" "-Dbacktrace_syminfo=__rbt_backtrace_syminfo" "-Dbacktrace_get_view=__rbt_backtrace_get_view" "-Dbacktrace_release_view=__rbt_backtrace_release_view" "-Dbacktrace_alloc=__rbt_backtrace_alloc" "-Dbacktrace_free=__rbt_backtrace_free" "-Dbacktrace_vector_finish=__rbt_backtrace_vector_finish" "-Dbacktrace_vector_grow=__rbt_backtrace_vector_grow" "-Dbacktrace_vector_release=__rbt_backtrace_vector_release" "-Dbacktrace_close=__rbt_backtrace_close" "-Dbacktrace_open=__rbt_backtrace_open" "-Dbacktrace_print=__rbt_backtrace_print" "-Dbacktrace_simple=__rbt_backtrace_simple" "-Dbacktrace_qsort=__rbt_backtrace_qsort" "-Dbacktrace_create_state=__rbt_backtrace_create_state" "-Dbacktrace_uncompress_zdebug=__rbt_backtrace_uncompress_zdebug" "-o" "/Users/ipsi/workspace/mailgun-contact-form/target/x86_64-unknown-linux-musl/release/build/backtrace-sys-4d856653fde87a65/out/src/libbacktrace/alloc.o" "-c" "src/libbacktrace/alloc.c"

--- stderr
thread 'main' panicked at '

Internal error occurred: Failed to find tool. Is `musl-gcc` installed?

', /Users/ipsi/.cargo/registry/src/github.com-1ecc6299db9ec823/cc-1.0.25/src/lib.rs:2260:5
note: Run with `RUST_BACKTRACE=1` for a backtrace.

warning: build failed, waiting for other jobs to finish...
error: build failed
```
Oops. That didn't work at all. It turns out that we need to tell Cargo (and Rust) about the compiler we've just installed.

### Cargo Configuration

That's fairly simple - we just need to add a file `.cargo/config` to our project, with the following content

```toml
[target.x86_64-unknown-linux-musl]
linker = "x86_64-linux-musl-gcc"
```
Right! And now let's do that again!

...

It fails again, with the same output (well, actually, quite a lot more, but still - the original error is still there).

Here, we need to add `CC_x86_64_unknown_linux_musl=x86_64-linux-musl-gcc` when running Cargo, e.g.,

```bash
CC_x86_64_unknown_linux_musl="x86_64-linux-musl-gcc" cargo build --release --target=x86_64-unknown-linux-musl
```
I don't know why, or why this environment is used, who uses it, or where's it documented (please drop me a note if you know!)

OK, so let's try that again.

```
error: failed to run custom build command for `openssl-sys v0.9.39`
process didn't exit successfully: `/Users/ipsi/workspace/mailgun-contact-form/target/release/build/openssl-sys-a4f1f3adb43f2007/build-script-main` (exit code: 101)
--- stdout
cargo:rerun-if-env-changed=X86_64_UNKNOWN_LINUX_MUSL_OPENSSL_LIB_DIR
cargo:rerun-if-env-changed=OPENSSL_LIB_DIR
cargo:rerun-if-env-changed=X86_64_UNKNOWN_LINUX_MUSL_OPENSSL_INCLUDE_DIR
cargo:rerun-if-env-changed=OPENSSL_INCLUDE_DIR
cargo:rerun-if-env-changed=X86_64_UNKNOWN_LINUX_MUSL_OPENSSL_DIR
cargo:rerun-if-env-changed=OPENSSL_DIR
run pkg_config fail: "Cross compilation detected. Use PKG_CONFIG_ALLOW_CROSS=1 to override"

--- stderr
thread 'main' panicked at '

Could not find directory of OpenSSL installation, and this `-sys` crate cannot
proceed without this knowledge. If OpenSSL is installed and this crate had
trouble finding it,  you can set the `OPENSSL_DIR` environment variable for the
compilation process.

Make sure you also have the development packages of openssl installed.
For example, `libssl-dev` on Ubuntu or `openssl-devel` on Fedora.

If you're in a situation where you think the directory *should* be found
automatically, please open a bug at https://github.com/sfackler/rust-openssl
and include information about your system as well as this message.

    $HOST = x86_64-apple-darwin
    $TARGET = x86_64-unknown-linux-musl
    openssl-sys = 0.9.39

', /Users/ipsi/.cargo/registry/src/github.com-1ecc6299db9ec823/openssl-sys-0.9.39/build/main.rs:269:9
note: Run with `RUST_BACKTRACE=1` for a backtrace.

warning: build failed, waiting for other jobs to finish...
error: build failed
```
It still doesn't work, but at least we're progressing! Now it's complaining about OpenSSL (having successfully compiled the packages it was complaining about previously).

### OpenSSL

This is where I hit an impenetrable wall.

All the other libraries I depend on appear to only require `libc`, and compile all the other code as part of their build. However, the `openssl-sys` crate assumes, by default, that OpenSSL has been installed somewhere, and it looks for the header files/etc, as you would expect it to do for a pre-compiled library.

However, I'm (a) running on macOS and (b) using MUSL, while any OpenSSL I'm likely to find will be compiled with GNU `libc` and dynamic linking. I will admit that I didn't go down this route, of compiling it on my own, partly because OpenSSL is... not trivial to compile.

The `openssl` crate *does* support compiling OpenSSL on my behalf, but that didn't work for me. Initially, I followed the docs, adding `openssl = { version = "0.10", feature = ["vendored"] }` to my `cargo.toml` , but that still results in `openssl-sys` being built, and I see a warning in the output of `warning: unused manifest key: dependencies.openssl.feature`.

Turns out that the docs are *slightly* wrong (it's fixed in master, but not in the released docs), and it should say `openssl = { version = "0.10", features = ["vendored"] }` – `features`, **not**`feature`!

With that changed, it now attempts to compile OpenSSL, but fails with a *ton* of errors like

```
apps/version.o:version.c:(.text.version_main+0x301): more undefined references to `OpenSSL_version' follow
apps/version.o: In function `version_main':
version.c:(.text.version_main+0x321): undefined reference to `BN_options'
version.c:(.text.version_main+0x337): undefined reference to `RC4_options'
version.c:(.text.version_main+0x34d): undefined reference to `DES_options'
version.c:(.text.version_main+0x363): undefined reference to `IDEA_options'
version.c:(.text.version_main+0x379): undefined reference to `BF_options'
version.c:(.text.version_main+0x39e): undefined reference to `OpenSSL_version'
collect2: error: ld returned 1 exit status
```
Ultimately, my fix for this was to remove my dependency on OpenSSL entirely, replacing it with [Rustls](https://github.com/ctz/rustls). This is done by setting a feature-flag on `actix-web`, like so

```toml
actix-web = { version="0.7", features=["rust-tls"] }
```
It's a lot newer than OpenSSL, and doesn't provide any support for TLS 1.1 and older, or any known-insecure algorithms. As a consequence, it's a lot simpler than OpenSSL, and is built purely in Rust, so doesn't require any magic to cross-compile.

I don't know if it's considered "production-ready" (there is some discussion about that [here](https://github.com/rust-lang-nursery/wg-net/issues/40)), but it certainly works for me. That said, PAS handles SSL termination for me, so I don't need to worry about inbound TLS support.

## Conclusion

The ultimate point of this was to explore how I could cross-compile my application. It turns out that is very straightforward, *unless* you're using native code, or a dependency that uses native code, in which case you *might* have issues.

Making a Rust project compile to another platform requires

1. Adding the target via `rustup` – `rustup target add x86_64-unknown-linux-musl`
2. Installing a compiler/linker/etc for your target – for macOS, we do this with `brew install filosottile/musl-cross/musl-cross`
3. Tell cargo which binaries to use for cross-compilation – in this case, we just add
   ```toml
   [target.x86_64-unknown-linux-musl]
   linker = "x86_64-linux-musl-gcc"
   ```
   to our `.cargo/config`
4. If using dependencies with native libraries, pass the correct compiler/linker to `cargo` via the `CC_x86_64_unknown_linux_musl` environment varible, or `CC_x86_64_unknown_linux_musl=x86_64-linux-musl-gcc` for us.
5. Avoid OpenSSL! It seems like it's reasonably complex to compile into a statically-linked application, so if you can use Rustls (or [Ring](https://github.com/briansmith/ring), the underlying crypto library), I'd recommend it!
   Note that this might be a feature flag on a dependency you use - check your dependency tree carefully!
