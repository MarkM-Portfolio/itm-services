# ITM + AppRegistry Extensibility

### What can be extended?

* What happens when people click entry?
* What happens when people click actions on entry?
* Others
  * Name
  * Image
  * Highlight
  * ...

### Data model

* Extensible `entries` per `entry type`. Each entry has a set of configuration on its extensibility based on which type it belongs to. e.g.
```
    Entry type => (name, image, a list of actions, highlight, expiration, enforced, ...)
```

* Org level entry settings vs. global/app level entry settings
  * There can be default settings for a certain type of entry, e.g. people entry may have `Bizcard` action in default.
  * Different host applications, e.g. OrientMe, Verse, Mobile, may have their own settings. Mobile may have `Make a call` action on person entry, while OrientMe won't.
  * User can extend settings per entry type within an org.
  * If org level settings not found for a given type, then go back to the default one.

* Action includes
  * type
  * icon
  * title(or key for i18n)
  * handler
  * isEnabled?
  * state?

* Action isEnabled depends on:
  * User capability(entitlement). e.g. show `Chat` if user entitled with Sametime or WebEx. `isEnabled = (context.user.capabilities.chat === true && entryType === 'people')`

  * Feature enablement. e.g. show `Share files` if Files enabled, or show `Post to Community` if it has status update widget installed. `isEnabled = (context.features.files === true && entryType === 'community')`

  * Application type. e.g. show `Make a call` if on mobile. `isEnabled = (context.app.type === 'mobile' && entryType === 'people')`.

  * Entry type. e.g. show `Post a message` if it’s community. `isEnabled = (entryType == 'community')`.

* Action state depends on:
  * Entry state, e.g. Display offline status for `Chat` action if people not online. This can be interpreted by client itself. There's no need to have AppRegistry or ITM services to do anything on it.

* Action handler includes:
  * Open dialog or div element
  * Open new window
  * Something native, e.g. make a call
  * Default actions, e.g. bizcard.

* Highlight
  * icon
  * title

### Where to store?


* Server side mode vs. client side mode: The entry type settings will be stored at server side, so that client does not need to store it locally or issue separate call to AppRegistry. All it needs is to send a single request to get entries with entry type settings from ITM services for current user.

* Data model transformation: AppRegistry will transform AppRegistry extention definition (in form of AppRegistry data model) into ITM entry type settings (in form of ITM data model).

* Local cache vs. centralized cache vs. AppRegistry cache
  * AppRegistry v2 has its own cache implemented by memcached to store its extention definition.
  * When we move to Redis pub/sub, it would be reasonable to talk to AppRegistry via pub/sub channel and the data could be stored centralized in Redis. When the centrialized cache not available for some reason, we still have the fall back to get data from AppRegistry using its own cache.
  * Do we need a 'local' cache, e.g. config file, or in memory, for efficiency? There won't be so many entry type settings data. For global/application level settings, maybe yes. But for org level, maybe not.
  * Do we need to store entry type settings into ITM db? Maybe not since we have Redis. Otherwise, how do we deal with sharding key?

### When to get?

* Add entry from entry type: eager mode vs. lazy mode. Create entry without adding entry type settings, add them only when get list

* Add entry type settings to entries on the fly
  * Incoming request to get entry list
  * Loop entry list to retrieve entry types (optional)
  * Get entry type settings from cache
  * Return entry list with entry type settings back

### How (often) to communicate with AppRegistry

* Pub/sub vs. AppRegistry v2 cache
  * AppRegistry v2 has cache mechanism: internal memcached + Not Modified via ETAG header. This could be short term solution.
  * When we move to Redis pub/sub, ITM as consumer will be able to recieve data from AppRegistry via inbouding channel.

### Special use cases

* Static entries(or default entries, non-persisted entries, auto add entries)
  * No need to save as entries into ITM db.
  * Automatically added into entries list.

* Time-sensitive entries(auto remove entries)
  * Add metadata like: `Expires: 2016-10-19T12:00:00`
  * Automatically removed from entries list.

Alternatively, both cases above can be moved out from the service scope and let client to do whatever they want, which means, AppRegistry and ITM services will only be responsible for data storage and data transfer for these special kinds of entry types. 

### Reference

* Sample snippet of ITM extension definition from App Registry.

e.g.

    {
      itemName: '#<<@UserName('martin_donnelly@ie.ibm.com')>>',
      itemType: 'Top Employee',
      itemImageUrl: "#<<@UserImage('martin_donnelly@ie.ibm.com')>>”,
      itemUrl: "https://uk.linkedin.com/in/martindonnelly1”,
      "initials": "MD”,
      highlight: {
        'style': {
          "color": "gold",
          "width": "20px",
          "height": "20px",
          "fontSize": "20px",
          "top": "-10px",
          "right": "-5px"
        },
        'icon': '2605',
        'title': "Top Employee of the Month: #<<@UserName('martin_donnelly@ie.ibm.com')>>"
      }
      verbs: [
        'chat': {
          'icon': 'https://techreformation.files.wordpress.com/2015/09/rsz_slack_icon.png'
          'action': 'https://ibm-cloudplatform.slack.com/messages/@martindonnelly/',
          'title': 'Contact #<<@UserName('martin_donnelly@ie.ibm.com')>> on Slack'
        }
      ]
    }