﻿define(['../durandal/app', './history'], function (app, history) {
    // Cached regular expressions for matching named param parts and splatted
    // parts of route strings.
    var optionalParam = /\((.*?)\)/g;
    var namedParam = /(\(\?)?:\w+/g;
    var splatParam = /\*\w+/g;
    var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

    function keys(){}
    function isRegExp() {}
    function isFunction() {}
    function map() {}

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    function routeToRegExp(route) {
        route = route.replace(escapeRegExp, '\\$&')
            .replace(optionalParam, '(?:$1)?')
            .replace(namedParam, function(match, optional) {
                return optional ? match : '([^\/]+)';
            })
            .replace(splatParam, '(.*?)');

        return new RegExp('^' + route + '$');
    }

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    function extractParameters(route, fragment) {
        var params = route.exec(fragment).slice(1);
        return map(params, function (param) {
            return param ? decodeURIComponent(param) : null;
        });
    }

    // Routers map faux-URLs to actions, and fire events when routes are
    // matched. Creating a new one sets its `routes` hash, if not set statically.
    var router = {};
    
    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    router.route = function (route, name, callback) {
        if (!isRegExp(route)) {
            route = routeToRegExp(route);
        }
        
        if (isFunction(name)) {
            callback = name;
            name = '';
        }
        
        if (!callback) {
            callback = router[name];
        }

        history.route(route, function(fragment) {
            var args = extractParameters(route, fragment);
            callback && callback.apply(router, args);
            router.trigger.apply(router, ['route:' + name].concat(args));
            router.trigger('route', name, args);
            history.trigger('route', router, name, args);
        });

        return router;
    };
    
    // Simple proxy to `history` to save a fragment into the history.
    router.navigate = function (fragment, options) {
        history.navigate(fragment, options);
        return router;
    };

    router.configure = function (options) {
        options || (options = {});

        if (options.routes) {
            router.routes = options.routes;
        }

        if (!router.routes) {
            return router;
        }

        var route, routes = keys(router.routes);

        // Bind all defined routes to history. We have to reverse the
        // order of the routes here to support behavior where the most general
        // routes can be defined at the bottom of the route map.

        while ((route = routes.pop()) != null) {
            router.route(route, router.routes[route]);
        }
        
        return router;
    };

    router.activate = function () {
        history.start();
        return router;
    };

    return router;
});