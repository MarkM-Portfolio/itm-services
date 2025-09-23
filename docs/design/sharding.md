## ITM sharding, org transfer, etc.

### Background

ITM will be deployed on Cloud in Aug Release. We need to be sure we are fine with this before it’s happened, and one typical thing is how to define shard key and deal with org transfer accordingly.

### Thoughts

Because:

1. The ITM usage scenario is typically all about a specific user retrieving its own ITM entries, rather than to retrieve entries under an organization. So, there’s really no strong reason from business perspective to have an orgId attribute to be stored in ITM entries.
2. Assume we do not have data residency requirement for our public cloud, there’s no need to add orgId into shard key.
3. It’s questionable that the org transfer is a frequently occurred case on today’s cloud.

As a result:

1. Because of 1 & 2 & 3, we should be fine without changing anything based on current ITM design & implementation.
2. Even we need to support 3, nothing needs to be done in ITM as long as 2 is true, because of 1. We don’t store orgId, then we don’t need to change anything after user transferred.
3. Even we have to store orgId for some reason, it should be easy to change the orgId as long as 2 is true. It’s just about to update the orgId attribute for a specific ITM entry, which can even be done in runtime, since we now sync people type entries by querying Profiles in runtime when user access its ITM entries, it’s just about to pick up the orgId from the response returned from Profiles, then update in ITM.