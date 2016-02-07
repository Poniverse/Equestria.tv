Equestria.tv
============

About
-----

[Equestria.tv](http://equestria.tv/) is the realtime video sharing site
operated by [Poniverse](https://poniverse.net/). The site's software is based
on the [CyTube](https://github.com/calzoneman/sync/) project.

Our fork uses Poniverse accounts for authentication, features our own branding,
and includes a number of tweaks for our needs.

Features
--------
- Standalone web/socket.io server
- Optional SSL support for socket.io and the account API
- Synchronized playback from the following sources:
  - YouTube (individual videos + playlists)
  - Google Docs videos
  - Vimeo
  - Dailymotion
  - Soundcloud
  - Raw video/audio files (via video.js)
- Embedding of the following sources:
  - livestream.com
  - twitch.tv
  - justin.tv
  - ustream.tv
  - RTMP streams
  - Custom `<iframe>` and `<object>` embeds
- Channel customization
  - HTML Message of the Day
  - CSS
  - JavaScript
  - Permissions
    - Tiered ranks (Site admin > Channel admin > Moderator > Leader > Member > Guest > Anonymous)
  - Chat filters (based on regular expressions)
  - Lock/unlock playlist to allow additions by non-moderators (configurable with permissions)
  - Searchable library of videos
- Integrated YouTube search
- Save/load playlists per user account
- Polls
- Voteskip (can be disabled by a channel moderator)
- Auto-AFK status (can be configured per-channel)
- Leader
  - Grants control of playback to a user (can pause/seek)
  - Can also be used to grant temporary mod-like powers to a user
  - Not necessary for synchronization as the server has an internal timer
- Channel state saves/loads on restart
- Account management
  - Password change
  - Password reset (via email)
  - Profile avatar and text
- Moderation
  - Mute users
  - Kick users
  - Ban users by name
  - Ban users by IP address (and by /24 range)
- Administration
  - Log viewer
  - Global bans
  - Search registered channels and users
  - Currently loaded channels
  - Stats (usercount, channelcount, RAM usage)

Installing
----------

[CyTube's installation instructions](https://github.com/calzoneman/sync/wiki/CyTube-3.0-Installation-Guide)

Equestria.tv comes with a `Vagrantfile` that includes all dependencies. After
running `vagrant up`, copy the `config.template.yaml` file to `config.yaml`,
get a Poniverse API key from a Poniverse developer, and insert it into
`config.yaml`.

After that, `vagrant ssh` and `/vagrant/run.sh` should bring up your own copy
of Equestria.tv at [http://192.168.39.19:8080/](http://192.168.39.19:8080/)!

Feedback
--------

Please open a GitHub Issue.

License
-------

Licensed under MIT.  See LICENSE for the full license text.

