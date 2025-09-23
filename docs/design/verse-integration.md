# Verse Integration - API Comparison

The Verse API spec can be found [here](https://jenkins.swg.usma.ibm.com/jenkins/job/sequoia/site/swagger-ui/index.html?url=https://jenkins.swg.usma.ibm.com/sequoia/itm-api.yaml#/).

The ITM API spec can be found [here](http://itm-docker2.rtp.raleigh.ibm.com:3000/explorer/).

## Summary on Difference

The key difference and API gaps basically from Verse point of view may include:

* Does Connections ITM APIs provide everything I need?
* How hard to consume those APIs. Those 2 APIs provide similar function but slightly different. How much effort to update Verse client to work with the new APIs.

The major difference between Verse and ITM on API spec according to the comparison made below include:

* Data model: ITM uses a single entry (by type) to represent a people, community, etc. while it Verse, it supports multiple people/collection maps to a single circle. Need to make sure what is the actual requirement behind for multiple people/collection mapping.
* User identity: It looks Verse uses mcode (something encoded from user email) to identify a specific user, while in ITM, it uses PROF_KEY (an immutable & unique user key stored in Connections Profiles).
* Email user (i.e. non-entitled user): Verse supports non-entitled user to be added into ITM bar, while these users may not be needed in OrientMe view. It requires ITM services to be able to provide a filter when query circles. This is supported by `tag filter` in ITM. Non-entitled user may have special tag, and these circles can be filtered in OrientMe as needed by issuing the query with a tag filter.

Other differences that may not be significant include:

* last visited vs. modified: Verse has a field called `last visited`. Need to make sure what it exactly means. In ITM, it has `modified` field used to track the timestamp of user's last update.
* Keywords vs. tags: Verse has a field called `keywords` in a circle. It is very similar to the field `tags` in ITM. Need to make sure what it exactly means.
* Reorder: The reorder API in verse is different than the one in ITM. It looks it requires client to specify the desired order for all circles (or multiple circles?) by a list of ordered Ids, while in ITM, it actually uses the semantic `insert before`, which requires client to specify the source circle and the id of target circle.

## Feature Parity

Feature												|Verse																								|ITM
----------										|----------																						|----------
Delete all circles						|DELETE /circles																			|N/A
Get all 'Circle' objects			|GET /circles																					|GET /entries
Add new circle								|POST /circles																				|POST /entries
Reorder circles								|PUT /circles																					|PUT /entry/:id/position
Delete circle by id						|DELETE /circles/{circleId}														|DELETE /entry/:id
Update various info for circle|PUT /circles/{circleId}															|PUT /entry/:id
Mark circle as 'viewed'				|GET /circles/{circleId}/view													|N/A
Add collection to a circle		|POST /circles/{circleId}/collection									|N/A
Remove collection from circle	|DELETE /circles/{circleId}/collection/{collectionId}	|N/A
Add person to circle					|POST /circles/{circleId}/person											|N/A
Remove person from circle			|DELETE /circles/{circleId}/person/{personId}					|N/A

Note:
* There is a bit terminology difference, e.g. circle in Verse vs. entry in ITM.
* ITM doesn't have `Delete all circles` for now, but it can have if needed.
* The data model used by Verse for its `Get all 'Circle' objects`, `Add new circle`, etc. is different than ITM. See below sections.
* ITM support reorder circle, but does not support reorder multiple circles as Verse does. It requires client to provide a list of ordered circle Ids. (parameter `orderedIds`)
* Verse supports `Mark circle as 'viewed'` by filling up last visit field. This is not supported in ITM for now. ITM has two fields related to time, created and modified.
* Verse support multipe people, collection within a certain circle, so it has option like `Add collection or person to a circle` and `remove collection or person from a circle`, while it's not supported in ITM.

## Data Model

### Verse Data Model

    Inline Model [
      circle
    ]
    circle {
      id (string, optional): SERVER-ASSIGNED identifier for this circle. ,
      label (string): Name of the circle ,
      keywords (Array[string], optional): keywords to be included in search for this circle. ,
      people (Array[person], optional),
      collections (Array[collection], optional),
      index (number): Unique positional index, should be able to map 1 to 1 with circle id ,
      last-visited (integer, optional): Last timestamp of messages or updates for this circle; 
          if anything newer is recieved, update the highwater mark for this circle.
    }
    person {
      id (string, optional): SERVER-ASSIGNED id string for this person ,
      display (string, optional): Name to be displayed for the person. 
          Should most likely not be 100% trusted, stored here mostly for convenience ,
      inet (string): Primary internet address for person ,
      secondaryInets (string, optional): comma-separated list of alternate inets for this person ,
      canonicalName (string, optional): Notes name for person
    }
    collection {
      id (string, optional): SERVER-ASSIGNED Unique identifier for collection ,
      payload (string): info used for query for this collection. 
          Used along with collectionType to determine what to do 
          when the user takes action on the corresponding circle.
          e.g. Connections-assigned id for 'community' type, 
          arbitrary solr query for 'solrQuery' type, implementation specific ,
      label (string, optional): Name of the collection ,
      collectionType (string, optional) = ['community', 'solrQuery']
    }

Note:
* The outer most element for Verse is a list of `circles`, while for ITM, the `entries` are embedded as an array attribute under the outer most element called `profile`. We will probably add more attributes under `profile`, e.g. `types`.
* `circle id` is server assigned in Verse, while it's currently required to be given by client in ITM, we could use auto-gen policy if needed.
* `label` required in Verse maps to `name` required in ITM.
* `keywords` in Verse maps to `tags` in ITM.
* Both `people` and `collections` are an array objects in Verse meaning that it supports multiple sub items within a circle, while in ITM, it only support single item which is the the entry itself.
* `index` required in Verse maps to `score` required in ITM.
* `last-visited` in Verse is a bit similar to `modified` in ITM, but not exactly the same.
* `people inet`, `people secondaryInets`, `people canonicalName` in Verse can be covered/extended by adding `metadata` in ITM.
* `collection payload` in Verse can be covered/extended by adding `metadata` in ITM, while `collection collectionType` can be extended using `metadata` as well, or maps directly to `type`.
* ITM has `image` while Verse doesn't. It looks Verse is using circle data to create the image URL by itself while it won't be working in ITM in case it is required to support data from other external source applications.

## Response Code

Feature												|Verse																										|ITM
----------										|----------																								|----------
Delete all circles						|204: No Content																					|N/A
Get all 'Circle' objects			|200: Success; 304: Not modified													|200: Success
Add new circle								|201: Created; 400: Invalid input; 409: Already exists		|422: Invalid input
Reorder circles								|N/A																											|TBD
Delete circle by id						|204: No Content; 400: Invalid input; 404: Not found			|200: Success
Update various info for circle|204: No Content; 412: Precondition failed; 404: Not found|TBD
Mark circle as 'viewed'				|204: No Content; 404: Not found													|N/A
Add collection to a circle		|201: Created; 400: Invalid input; 409: Already exists		|N/A
Remove collection from circle	|200: Success; 400: Invalid input; 409: Already exists		|N/A
Add person to circle					|201: Created; 400: Invalid input; 409: Already exists		|N/A
Remove person from circle			|200: Success; 400: Invalid input; 409: Already exists		|N/A

Note
* The main difference is that ITM using 422 to indicate `Invalid input` which is the default behavior of Loopback. This can be adjusted as needed.

## Catching

In Verse, most REST methods has a head or URL parameter called X-Last-Modified-Values, which is a CSV Last-Modified dates of the circles. If the Last-Modified date is greater on the server than this date, return 304.