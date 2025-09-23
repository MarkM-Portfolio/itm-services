# Log Level Criteria

Levels: error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5

* error: runtime errors or unexpected conditions. like error to connect profiles api when loading user info. The function will be broken when error happens. But the whole system can still work.
* warn: something unexpected happened, but that execution can continue. Like a configuration file was missing but defaults were used. Something is not right, but it hasn't gone properly wrong yet - warnings are often a sign that there will be an error very soon.
* info: important runtime events information(startup/shutdown, login/logout). like the important info datasource used, mixin loading etc.
* debug: something normal and insignificant happened. like the normal error which were handled nicely in our codes.
* silly: more detailed information. May cause huge logs. like the repeated operation related, data information related. It might be enabled when debugging an issue to get more information.

We didn't use verbose in our codes