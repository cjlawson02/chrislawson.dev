---
layout: page
title: Contact
nav-menu: true
show-tile: false
---

Fill out the form below or use the email listed to get in touch!

<section id="contact">
    <div class="inner">
        <section>
            <form action="https://formspree.io/f/xpzkeldd" method="POST">
                <div class="field half first">
                    <label for="name">Name</label>
                    <input type="text" name="name" id="name" />
                </div>
                <div class="field half">
                    <label for="email">Email</label>
                    <input type="text" name="_replyto" id="email" />
                </div>
                <div class="field">
                    <label for="message">Message</label>
                    <textarea name="message" id="message" rows="6"></textarea>
                </div>
                <ul class="actions">
                    <li><input type="submit" value="Send Message" class="special" /></li>
                    <li><input type="reset" value="Clear" /></li>
                </ul>
            </form>
        </section>
        <section class="split">
            <section>
                <div class="contact-method">
                    <span class="icon alt fa-envelope"></span>
                    <h3>Email</h3>
                    <a href="mailto:{{ site.email }}">{{ site.email }}</a>
                </div>
            </section>
        </section>
    </div>
</section>
