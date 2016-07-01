---
layout: post
title:  "Rust from a Java programmer's perspective (Part 1)"
date:   2016-07-01 15:18:12 +0200
categories: rust java
---
Recently, I've started looking into [Rust](https://www.rust-lang.org).
Why? Well, I've always liked the idea of getting into lower-level, close-
to-the-hardware things (maybe picking up a Raspberry Pi, etc), but C and
C++ have never really held a lot of interest for me - they're much 
more... manual than the languages I'm used to, and a lot less safe.

Enter Rust - developed by [Mozilla](https://www.mozilla.org/en-US/), and 
open-sourced under the [MIT](https://github.com/rust-lang/rust/blob/master/LICENSE-MIT) 
and [Apache](https://github.com/rust-lang/rust/blob/master/LICENSE-APACHE) 
licenses. It's intended to be a replacement for C (but *not* C++!), with
a few interesting tweaks - by default, guaranteed, 
enforced-by-the-compiler memory lifetimes (so no dangling pointers, no 
null pointers, no data races, etc!), a slightly more OOP approach, as
structs can have functions defined upon them, generics, "no overhead" 
abstraction, etc, while still compiling down to native code.

Anyway, I have been slowly trying to learn this over the last month or
two - I have no projects I wanted to start writing in Rust, so I've been 
relying on Reddit's [/r/dailyprogrammer](https://www.reddit.com/r/dailyprogrammer) 
to provide interesting challenges to get stuck into.

My first couple of attempts can be found on [GitHub](https://github.com/ipsi/reddit-daily-programmer).

The first problem, `267_dog`, was pretty trivial - write a loop, check 
some conditions and then print some information. Very basic, and not a 
lot that's interesting in it.


You’ll find this post in your `_posts` directory. Go ahead and edit it and re-build the site to see your changes. You can rebuild the site in many different ways, but the most common way is to run `jekyll serve`, which launches a web server and auto-regenerates your site when a file is updated.

To add new posts, simply add a file in the `_posts` directory that follows the convention `YYYY-MM-DD-name-of-post.ext` and includes the necessary front matter. Take a look at the source for this post to get an idea about how it works.

Jekyll also offers powerful support for code snippets:

{% highlight ruby %}
def print_hi(name)
  puts "Hi, #{name}"
end
print_hi('Tom')
#=> prints 'Hi, Tom' to STDOUT.
{% endhighlight %}

Check out the [Jekyll docs][jekyll-docs] for more info on how to get the most out of Jekyll. File all bugs/feature requests at [Jekyll’s GitHub repo][jekyll-gh]. If you have questions, you can ask them on [Jekyll Talk][jekyll-talk].

[jekyll-docs]: http://jekyllrb.com/docs/home
[jekyll-gh]:   https://github.com/jekyll/jekyll
[jekyll-talk]: https://talk.jekyllrb.com/
