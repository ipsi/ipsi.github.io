+++
title = "The Great Blog Migration"
description = ""
date = 2023-08-20T19:02:00Z
draft = true
+++
I spent a little while today moving this blog from [Ghost][ghost] to
[Zola][zola], and therefore also moving the hosting from [Digital Ocean][do] to
[GitHub Pages][ghp].

Why? It's pretty simple, really - Ghost is an blogging *platform* - it's a 
NodeJS process that runs server-side, makes adding or changing posts very 
simple, and serves the content itself. It also has a number of other 
features that I simply don't ever see myself making use of, things like 
tracking "engagement" or subscribers to your blog, things like that.

Looking at the number of posts I've made, *ever*, that... seems a bit like 
overkill. I have no doubt they're very useful features for those who are 
much more prolific writers than I am, and who have much larger followings, 
but they're not features that I'm using.

On top of that, because Ghost requires a NodeJS server-side process, I'm paying 
money monthly for a server, and that's... just not necessary. It's not a lot 
each month, but it adds up over time and given how few posts I'm actively 
publishing here it doesn't make sense to keep paying that every month.

GitHub Pages provides a completely free way to serve this blog which meets 
all of my really very simple needs:

* Publish some HTML
* Let me use my own domain
* HTTPS
* Free or *extremely* cheap

The next step, then was picking the tool I'd use to generate this blog. 
There are plenty of static site generators out there - which is what I'd 
need to use - and it was to some extent a matter of excluding the ones I 
didn't like for increasing arbitrary reasons until I had just one left:

* Nothing in Ruby, NodeJS, Python, etc - I want a single binary and don't 
  want to wind up in Gem hell or `node_modules` hell or whatever (this 
  excludes a lot already), and I'm probably going to use this on Windows 
  quite a bit so the experience should be reasonable there.
* Must have basic support for non-blog pages (like an About page)
* I don't like GoLang all that much, and I'd like to be able to at least 
  pretend that I could enjoy contributing to whichever tool I'm using.

The end result of that was that I chose [Zola][zola]. It's a static site 
generator, with a single binary and is written in Rust (which I *do* like).

[ghost]: https://ghost.org/
[zola]: https://www.getzola.org/
[do]: https://www.digitalocean.com/
[ghp]: https://pages.github.com/