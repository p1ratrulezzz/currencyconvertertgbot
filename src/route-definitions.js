let RoutesDefinition = function () {
    this._routes = {};

    let self = this;

    this.newRoute = function (path, handler) {
        this._routes[path] = handler;
    }

    this.findRouteHandler = function(path) {
        return new Promise((resolve, reject) => {
            if (self._routes[path] == null) {
                return reject(new Error("route not found"));
            }

            return resolve(self._routes[path]);
        });
    }
}

export {
    RoutesDefinition
}