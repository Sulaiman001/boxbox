boxboxevents
============

A framework that makes it easier to use the Box2d / Box2dweb physics engine in JavaScript, with mouse and multitouch events support.

* Web site : http://topheman.github.io/boxbox
* Tutorial : http://topheman.github.io/boxbox/getting-started.html
* API documentation : http://topheman.github.io/boxbox/boxbox/updoc.topheman.html
* Demo : http://topheman.github.io/boxbox/boxbox/demos/topheman/smileyFaces/demo.html

##About boxboxevents

It is a fork of [boxbox](https://github.com/incompl/boxbox), originally created at [Bocoup](http://bocoup.com) by Greg Smith, based on the [Box2dWeb physics engine](http://code.google.com/p/box2dweb/).

I needed an abstract layer to Box2dWeb to simplify the manipulation of physics objects to create some html5/js game. I was going to make my own, but after some research, I found boxbox and decided to fork it and add all the mouse/multitouch events interraction layer you always need for games such as angry birds.

Feel free to use it to create your own games, currently, the version is stable, works on chrome, firefox, safari, ie9+, as well on desktop and mobile device (sorry, for the moment, it shouldn't be working on the windows phones that only support pointer events - not touchstart/move/end).

I'm still working on it, to improve the code and maybe if you have some relevent features, don't hesitate to make suggestions.

Tophe

![boxboxevents](http://topheman.github.io/boxbox/boxbox-events.png)