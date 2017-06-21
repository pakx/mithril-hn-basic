# mithril-hn-basic

A basic version of the [Hacker News App](https://hnpwa.com/), less the "progressive" part, that uses Mithril (v1.x) and serves as an extended example for [Basic Mithril App Structure](https://github.com/pakx/the-mithril-diaries/wiki/Basic-Mithril-App-Structure).

## Building

No build system or local dependencies. And Mithril is loaded from a CDN.

## Running

To run, download the `src` folder, then open `index.html` (even just directly from the filesystem) in a modern browser.

## Spec

See [specifications](https://github.com/tastejs/hacker-news-pwas#specification)

For our purposes, HN consists of categories of posts: "news", "ask", "jobs", etc. Each category is accessed via a distinct url/route. For each category we display a set number of pages, and 30 posts per page.

![Fig 1. HN Objects](doc/images/mithril-hn-spec-01.png "Fig 1. HN entities")

A post, depending on category, may link to an externally-hosted article (as is usually the case with "news"), or to in-situ content (as with "ask"). Posts are made by users, and can have comments. Post-metadata indicates how to access post-content, comments, and information about the user.

## Code Notes

See [Basic Mithril App Structure](https://github.com/pakx/the-mithril-diaries/wiki/Basic-Mithril-App-Structure) for an overview of application structure. Then see `app.js/view()` and `app.js/createActions()` for app-UI and -behavior -- both should be self documenting/explanatory.

`model`, for modeling our entire app and for being slightly dense, could bear some explanation:

- the current route/category is stored in `model.routeName`

- for each route we fetch/display a max number of pages. For convenience we cache previously-fetched pages (and other entities). What we've fetched/cached, the page we're viewing, etc, is stored per route-name in `model.routesInfo`. Each "routeInfo" object is essentially a row from `settings.routesDesc`, plus a few additional properties.

- `model.routesInfo` includes 2 routes, "item" and "user", to which a user doesn't navigate directly (e.g. they're not reflected in the navigation links at top; see `settings.routesDesc[...].isMenu`), but which let us treat route-fetched data uniformly (by serving to cache `http://.../item/...`- and `http://.../user/...`-fetched data).

- while `model.routeName` indicates the current route/category, within each category we may display different entities: a page, specific post, a comment, a user, etc. The type of entity to display, and the specific entity to display, is represented by `model.displayFor` and `model.displayForId`.

- lastly, since we deal nearly entirely with domain data and little application state, we elect not to have an explicit view model.

Given our app is small, `model.displayFor` is managed via string comparisons; were our app more involved we'd probably use predefined keys, unions, or similar.

There's some code duplication in `createActions()` at blocks commented with `// trim cache size to routeInfo.cacheMax` -- my preference is to abstract at the 2nd-3rd repeat.

`actions` contains some methods -- such as `getUserHref()` -- that more properly belong in a "UI helper" object.

In the UI we use route names as navigable-to category names; strictly speaking we should use a different "label" -- for example the nav menu "news" should be "New", going by other sample HN app implementations.

Tree-structure CSS is adapted from https://gist.github.com/dylancwood/7368914. See also: http://odyniec.net/articles/turning-lists-into-trees/

