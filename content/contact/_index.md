+++
title = "Contact"

description = "How to get in contact"
+++

You can find my social media links at the bottom of each page, email me at 
`andrew [at] thorburn-family [dot] com`, or use the following form to send 
me a message (all fields required).

<noscript>
<div>
This contact form relies on JavaScript to 
provide a reasonable experience. It should work without it, but it might 
only display the raw JSON response, or even a blank page, depending on your 
browser.
</div>
</noscript>

<form id="contactme" class="contact-me" 
    enctype="application/x-www-form-urlencoded" 
    action="https://mailgun-contact-form.fly.dev/">
    <fieldset>
        <label for="email">E-Mail</label>
        <input id="email" type="text" name="from_email">
        <label for="name">Name</label>
        <input id="name" type="text" name="from_name">
        <label for="subject">Subject</label>
        <input id="subject" type="text" name="title">
        <label for="message">Message</label>
        <textarea id="message" name="body"></textarea>
        <input type="submit">
    </fieldset>
</form>
<div id="post-success" style="display: none">Message sent successfully</div>
<div id="post-failure" style="display: none">Message could not be sent. Reason:
<span id="error-message"></span></div>
<script src="/js/contactme.js"></script>