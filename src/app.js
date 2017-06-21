// See README.md

var settings = {
    apiHost : "https://node-hnapi.herokuapp.com"
    , routesDesc : [
        {name:"news", pagesMax:15, cacheMax:15, isMenu: true}
        , {name: "show", pagesMax: 3, cacheMax:3, isMenu: true}
        , {name: "ask", pagesMax: 3, cacheMax:3, isMenu: true}
        , {name: "jobs", pagesMax: 1, cacheMax:1, isMenu: true}
        , {name: "item", pagesMax: 0, cacheMax:10, isMenu: false}
        , {name: "user", pagesMax:0, cacheMax:10, isMenu: false}
    ]
}

window.addEventListener("DOMContentLoaded", function(){
    var model = createModel(settings)
        , dataApi = createDataApi(settings)
        , actions = createActions(model, dataApi)
        , routeResolver = createRouteResolver(settings, model, actions)
        , defaultRoute = "/" + settings.routesDesc[0].name + "/1"

    m.route(document.body, defaultRoute, routeResolver)
})

/// Returns idempotent view-function that renders UI per passed-in model
var view = (function() {

    function view(model, actions) {
        return vwApp(model, actions)
    }

    function vwApp(model, actions) {
        return m(".app"
            , vwAppHeader(model, actions)
            , vwAppBody(model, actions)
        )
    }

    function vwAppHeader(model, actions) {
        return m(".app-header"
            , m("a[href='/']"
                , {oncreate:m.route.link}
                , m("img.logo"
                    , { src: "https://mithril.js.org/logo.svg"
                        , alt: "Mithril Logo"
                    }
                )
            )
            // navigable-to category links:
            , Object.keys(model.routesInfo)
                .filter(function(key) {
                    return model.routesInfo[key].isMenu
                })
                .map(function(key) {
                    var itm = model.routesInfo[key]
                        , cls = itm.name == model.routeName ? ".active" : ""
                        , href = "/" + itm.name + "/1"
                    return m("a" + cls
                        , { href: href, oncreate: m.route.link }
                        , itm.name
                    )
            })
        )
    }

    function vwAppBody(model, actions) {
        return m(".body"
            , model.displayFor.match(/[CI]/) ? vwItem(model, actions)
                : model.displayFor == "U" ? vwUser(model, actions)
                : vwPage(model, actions)
        )
    }

    function vwItem(model, actions) {
        return m(".item"
            , m(".item-controls", vwLinkHistoryBack())
            , vwItemBody(model, actions)
        )
    }

    function vwItemBody(model, actions) {
        var item = actions.getData("item", model.displayForId)
        return ! item
            ? m(".item-body", "Loading ...")
            : m(".item-body"
                , m(".item-title", item.title)
                , m(".item-content", m.trust(item.content))
                , item.comments 
                    ? [ m(".label-comments", "Comments")
                        , m("ul.tree", vwItemComments(item.comments, actions))
                    ]
                    : m(".label-comments-none", "(No Comments)")
            )
    }

    function vwItemComments(comments, actions) {
        return m(".comments"
            , comments.map(function(itm) {
                var user = itm.user || ""
                    , userHref = actions.getUserHref(itm)
                return m("li"
                    , m(".comment"
                        , m(".annotations"
                            , user ? m("a.user"
                                , { href: userHref, oncreate: m.route.link}
                                , itm.user
                                )
                                : m("span.user", "(n/a)")
                            , m(".time-ago", itm.time_ago)
                        )
                        , m(".item-content", m.trust(itm.content))
                        , itm.comments
                            ? m("ul", vwItemComments(itm.comments, actions))
                            : ""
                    )
                )
            })
        )
    }

    function vwUser(model, actions) {
        var user = actions.getData("user", model.displayForId)
        return ! user 
            ? m(".user", "Loading ...")
            : m(".user"
                , m(".user-controls", vwLinkHistoryBack())
                , m(".user-id", "User: ", user.id)
                , m(".user-joined", "Joined: ", user.created)
                , m(".user-karma", "Karma: ", user.karma)
            )
    }

    function vwPage(model, actions) {
        return m(".posts"
            , vwPageHeader(model, actions)
            , vwPageBody(model, actions)
        )
    }

    function vwPageHeader(model, actions) {
        var routeInfo = model.routesInfo[model.routeName]
        return m(".posts-controls"
            , m("button"
                , { disabled: routeInfo.pageNum <= 1
                    , onclick: actions.onPrev
                }
                , "< Prev"
            )
            , m("span"
                , "(", model.routeName, ") "
                 , routeInfo.pageNum, "/", routeInfo.pagesMax
            )
            , m("button"
                , { disabled: routeInfo.pageNum >= routeInfo.pagesMax
                    , onclick: actions.onNext
                }
                , "Next >"
            )
        )
    }

    function vwPageBody(model, actions) {
        var pageNum = model.routesInfo[model.routeName].pageNum
            , startNum = (pageNum - 1) * model.postsPerPage + 1
            , posts = actions.getData(model.routeName, pageNum)

        return ! posts
            ? m(".posts-body", "Loading...")
            : m(".posts-body"
                , m("ol"
                    , { start: startNum }
                    , posts.map(function(itm) {
                        return m("li", vwPostBody(itm, actions))
                    })
                )
            )
    }

    function vwPostBody(post, actions) {
        var postInfo = actions.getPostInfo(post)
            , userHref = actions.getUserHref(post)
            , commentsHref = actions.getCommentsHref(post)
            , attrs = Object.assign({ href: postInfo.url }
                , postInfo.isRoutable ? {oncreate: m.route.link} : {}
            )

        return m(".post"
            , m("a", attrs, post.title)
            , m(".annotations"
                , post.points == null ? ""
                    : m(".post-points"
                        , post.points + " point" + (post.points  == 1 ? "" : "s")
                    )
                , post.user == null ? ""
                    : [ "by "
                        , m("a.user"
                            , { href: userHref, oncreate: m.route.link}
                            , post.user
                        )
                    ]
                , m(".time-ago", post.time_ago)
                , " | "
                , m(".post-comments-count"
                    , post.comments_count > 0
                        ? m("a"
                            , { href: commentsHref, oncreate: m.route.link}
                            , post.comments_count + " comment"
                                + (post.comments_count == 1 ? "" : "s")
                            )
                        : "0 comments"
                )
            )
        )
    }

    function vwLinkHistoryBack(label) {
        return m("a[href='#']"
            , { onclick: function(e) {
                e.preventDefault()
                window.history.back()
            }}
            , label || "Go Back"
        )
    }

    return view
})()

/// Returns object encapsulating app-behavior
function createActions(model, dataApi) {
    return {
        onNavigateTo : onNavigateTo
        , onPrev : onPrev
        , onNext : onNext
        , getData : getData
        , getPostInfo : getPostInfo
        , getUserHref : getUserHref
        , getCommentsHref : getCommentsHref
    }

    function onNavigateTo(routeName, params) {
        var routeInfo = model.routesInfo[routeName]
            , id = params.id

        model.displayFor = routeName == "comment" ? "C"
            : routeName == "item" ? "I"
            : routeName == "user" ? "U"
            : "O" // other

        if (model.displayFor.match(/[CI]/)) {
            model.displayForId = id
            if (! getData(routeName, id)) {
                fetchItem(routeName, id)
            }
        } else if (model.displayFor == "U") {
            model.displayForId = id
            if (! getData(routeName, id)) {
                fetchUser(routeName, id)
            }
        } else if (isNaN(id) || +id < 0 || +id > routeInfo.pagesMax) {
            m.route.set("/" + routeName + "/1")
            return

        } else {
            model.routeName = routeName
            routeInfo.pageNum = +id
            if (! getData(routeName, id)) {
                fetchPage(routeName, id)
            }
        }
    }

    function onPrev() {
        var pageNum = model.routesInfo[model.routeName].pageNum
        if (pageNum > 1) {
            m.route.set("/" + model.routeName + "/" + (pageNum - 1))
        } 
    }

    function onNext() {
        var pageNum = model.routesInfo[model.routeName].pageNum
        if (pageNum < model.routesInfo[model.routeName].pagesMax) {
            m.route.set("/" + model.routeName + "/" + (pageNum + 1))
        } 
    }

    function getData(routeName, id) {
        return model.routesInfo[routeName].cache.vals[id]
    }

    function fetchPage(routeName, pageNum) {
        var routeInfo = model.routesInfo[routeName]
        return dataApi.fetchPage(routeName, pageNum)
            .then(function(data) {
                if (data.length) {
                    routeInfo.cache.vals[pageNum] = data
                    routeInfo.cache.keys.push(pageNum)
                    if (data.length < model.postsPerPage) {
                        routeInfo.pagesMax = 
                            Math.max.apply(null, routeInfo.cache.keys)
                    }
                }
            })
            .catch(function(err) {
                console.error(err)
            })
    }

    function fetchItem(routeName, id) {
        var routeInfo = model.routesInfo[routeName]
        return dataApi.fetchItem(id)
            .then(function(data) {
                routeInfo.cache.vals[id] = data
                routeInfo.cache.keys.push(id)
                // trim cache size to routeInfo.cacheMax
                if (routeInfo.cache.keys.length > routeInfo.cacheMax) {
                    delete routeInfo.cache.vals[routeInfo.cache.keys[0]]
                    routeInfo.cache.keys = routeInfo.cache.keys.slice(1)
                }
            })
            .catch(function(err) {
                console.error(err)
            })
    }

    function fetchUser(routeName, id) {
        var routeInfo = model.routesInfo[routeName]
        return dataApi.fetchUser(id)
            .then(function(data) {
                routeInfo.cache.vals[id] = data
                routeInfo.cache.keys.push(id)
                // trim cache size to routeInfo.cacheMax
                if (routeInfo.cache.keys.length > routeInfo.cacheMax) {
                    delete routeInfo.cache.vals[routeInfo.cache.keys[0]]
                    routeInfo.cache.keys = routeInfo.cache.keys.slice(1)
                }
            })
            .catch(function(err) {
                console.error(err)
            })
    }

    function getPostInfo(post) {
        var matches = post.url.match(/^item\?id=(\d+)/i)
        return {
            url : matches ? "/item/" + matches[1] : post.url
            , isRoutable: matches != null
        }
    }

    function getUserHref(itm) {
        return itm.user ? "/user/" + itm.user : ""
    }

    function getCommentsHref(post) {
        return "/item/" + post.id
    }

    function delay(ms) {
        return new Promise(function(resolve) {
            setTimeout(resolve, ms)
        })
    }
}

/// Returns object modeling entire app as data
function createModel(settings) {
    return {
        // name of curent route
        routeName: settings.routesDesc[0].name

        // data associated w/ each route-name
        // we cache entities previously accessed, up to a max per cache
        , routesInfo: settings.routesDesc.reduce(function(acc, itm){
            var routeInfo = {pageNum: 1, cache: {keys:[], vals:{}}}
            acc[itm.name] = Object.assign(routeInfo, itm)
            return acc
        }, {})

        // type of entity to display
        // one of C|I|U|O = comment/item/user/other
        , displayFor: undefined

        // id of entity to display; applies to C|I|U
        , displayForId: undefined

        , postsPerPage : 30
    }
}

function createRouteResolver(settings, model, actions) {
    return settings.routesDesc.reduce(function(acc, itm){
        acc["/" + itm.name + "/:id"] = {
            onmatch: function(params, route) {
                actions.onNavigateTo(itm.name, params)
            }
            , render: function() {
                return view(model, actions)
            }
        }
        return acc
    }, {})
}

/// Returns object encapsulating external data access
function createDataApi(settings) {
    return {
        fetchPage: function(routeName, pageNum) {
            return m.request({
                type: "GET"
                , url: settings.apiHost
                    + "/" + routeName + "?page=" + pageNum
            })
        }
        , fetchItem: function(id) {
            return m.request({
                type: "GET"
                , url: settings.apiHost + "/item/" + id
            })
        }
        , fetchUser: function(id) {
            return m.request({
                type: "GET"
                , url: settings.apiHost + "/user/" + id
            })
        }
    }
}
