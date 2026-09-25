---
# Copy this file to a new name (for example staffing-forecast.md) and edit.
# Delete `draft: true` to make it appear on the portfolio page.
# This file stays hidden as long as draft is true.

title: The Clock
description: Building an 8-bit breadboard computer from scratch.
stack:
link: 
featured: false   # true renders a wide, olive card
span: 3           # optional: 4, 5, 6, 7 or 8. Ignored when featured is true.
order: 4          # lower numbers sort first
draft: false
---

# Breadboard 8-Bit computer

Out of shear interest, and after admiration of Ben Eater and his 8-bit breadboard computer project, I decided to take the chance and start it myself. For reference, the final project looks as such:

![Breadboard Computer](/content_img/bb_final.png)

So I started building. Mr. Eater actually makes things easier for you and has all of the materials needed and a walk through of how he built it. One thing that is appreciated, he does not descriptively tell you exactly how to put it together, but instead educates you on it as well. 

With that, up first is the clock.

## The Clock

If you read my about me, you know that I have a lot of interests in a lot of different things. Computers are clearly one of them. I am also a firm believer that in order to understand something, build it from the ground up. And so here is the first step.

Something that was a learning curve for me was the electrical termanology, the resistors and capacitors, understanding the pin layout of the 555 timer and how to use it to our advantage, etc. But instead of going into the nitty gritty, here's some photos of what I was able to put together.

For reference, here is the schematics that you can find from Ben Eater himself:

![Clock Schematics](/content_img/clock_schematics.png)

Here's the multi use of the 555 timers; the top is creating the square wave, the middle is used to make a clean latch, and the bottom one is used to easily switch between the two:

![Putting together the square wave](/content_img/555_timers.png)

Next, I had to use a a Quad AND gate, Quad OR gate and a hex inverter. I then followed the practice of just using longer wires to get the logic down before making the aesthetic cuts:

![testing logic](/content_img/testing_logic.png)

Finally, once I got what was needed, I then made necessary cuts and here is the end result from it:

![Breadboard Clock](/content_img/bb_clock.png) 

This is where I left off, but as I continue, I'll be sure to add more information!