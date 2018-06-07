# autoscrolldown README

This Visual Studio Code extension automatically scrolls externally modified files to the end. By default, Code just reloads these files; with `autoscrolldown` they also scroll to the last line if certain conditions are met.

## Features

Simply enable the `autoscrolldown` settings in the config or run the command.

An example of how the command performs:

![autoscroll example](images/autoscrolldown.gif)

You'll know the feature is active when you see the "arrow-down" indicator in the status bar:

![autoscroll indicator](images/indicator.png)

Depending on the `onlyWhenAtEnd` setting, sometimes it's necessary to be at the very end of the buffer for the indicator to appear and the extension to do its job.

## Requirements

Visual Studio Code newer than 1.19.0.

## Extension Settings

This extension contributes the following settings:

* `autoscrolldown.allFiles`: all files scroll automatically to the end when modified externally
* `autoscrolldown.onlyWhenAtEnd`: scrolling happens only if the cursor was already in the last position within the file

There is also one command available, useful when `autoscrolldown.allFiles` is turned off:

* `autoscrolldown: Toggle autoscroll To End For Current File`

## Known Issues

None yet.

## Release Notes

### 1.0.1

Update js/ts dependencies for security reasons.
