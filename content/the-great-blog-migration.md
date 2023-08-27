+++
title = "The Great Blog Migration"
description = ""
date = 2023-08-22T19:35:00Z
[taxonomies]
categories = ["Technical"]
tags = ["blog"]
+++
I spent a little while this weekend moving this blog from [Ghost][ghost] to
[Zola][zola], and therefore also moving the hosting from [Digital Ocean][do] to
[GitHub Pages][ghp].

Why? It's pretty simple, really - I don't need a server-side process rendering
my blog. Ghost seemed like an interesting platform when I first used it, 
five-ish years ago, but it also appears to have pivoted since then and is 
now focused a lot more on "creators" and "engagement" and so on - providing 
tools for people who have a large audience and are trying to earn money from 
their writing. Indeed, their headline is now "Turn your audience into a 
business."

Given the number of posts I've made (_cough_), that's pretty clearly not 
something I have a need for right now, and may not _ever_ need, unless I 
take a sharp right turn into writing as a career.

On top of that, because Ghost requires a NodeJS server-side process, I have 
to deal with the following:

* Monthly payments (small, but not zero)
* Keeping the VPS up-to-date with security patches/etc
* Keeping Ghost up-to-date

It's not _a lot_ of work, but it also should be done even if I'm not 
actively posting blog posts, and I'd much prefer something where _none_ of 
the above is necessary. Ghost does provide a [hosted option][ghosthost], for 
example, but even the lowest tier is US$9/month.

So why GitHub Pages? It provides a completely free way to serve this blog 
which meets all of my really very simple needs:

* Publish some HTML
* Let me use my own domain
* HTTPS
* No server or platform maintenance
* Free or *extremely* cheap

Am I over the moon about adding another bit of the web that's reliant on 
GitHub? Well... no. But since I'm migrating off of Ghost as a platform, I 
need to look for another tool to actually, y'know, make a website.

Obviously, anything that needs to actually run code in response to a request 
is out - so no WordPress, nothing like that. GitHub Pages, [by default][ghpjek]
is, by default, powered by [Jekyll][jekyll]. However, I'm not a fan of 
Jekyll just because it's build in Ruby, and _that_ means having to deal with 
installing Ruby, managing Gems, and god forbid I install another Ruby-based 
tool that needs incompatible Gems or something. And yes, there are tools to 
work around all of that but since I'm not _already_ in the Ruby system, I'd 
really prefer something that's just a single, drop-in binary.

The other advantage of these tools is that I have everything stored in Git, 
in Markdown, and so migrating elsewhere is just a matter of running the 
`generate` command of whichever tool I'm using and uploading the resulting 
files to the host. So if GitHub starts looking dodgy, it's about as easy as 
it can be to migrate.

So the next step, then, was picking the tool I'd use to generate this blog. 
There are plenty of static site generators out there, and it was to some extent
a matter of excluding the ones I didn't like for increasing arbitrary 
reasons until I had just one left:

* Nothing in Ruby, NodeJS, Python, etc - I want a single binary and don't 
  want to wind up in Gem hell or `node_modules` hell or whatever (this 
  excludes a lot already), and I'm probably going to use this on Windows 
  quite a bit so the experience should be reasonable there.
* Must have basic support for non-blog pages (like an About page)
* I'd like to be able to at least pretend that I could enjoy contributing 
  to whichever tool I'm using and I'm a bit of a language snob - I love Rust 
  and dislike (but don't hate) GoLang, for example.

The end result of that was that I chose [Zola][zola]. It's a static site 
generator, with a single binary and is written in Rust. It's very simple to 
use, and while it might not be as full-featured as older tools like [Jekyll]
[jekyll], it's more than enough for my needs.

[ghost]: https://ghost.org/
[ghosthost]: https://ghost.org/pricing/
[zola]: https://www.getzola.org/
[do]: https://www.digitalocean.com/
[ghp]: https://pages.github.com/
[ghpjek]: https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll
[jekyll]: https://jekyllrb.com/