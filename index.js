/**
 * Created by Diluka on 2016-05-04.
 *
 *
 * ----------- 神 兽 佑 我 -----------
 *        ┏┓      ┏┓+ +
 *       ┏┛┻━━━━━━┛┻┓ + +
 *       ┃          ┃ 　
 *       ┣     ━    ┃ ++ + + +
 *      ████━████   ┃+
 *       ┃          ┃ +
 *       ┃  ┴       ┃
 *       ┃          ┃ + +
 *       ┗━┓      ┏━┛  Code is far away from bug
 *         ┃      ┃       with the animal protecting
 *         ┃      ┃ + + + +
 *         ┃      ┃　              　
 *         ┃      ┃ +
 *         ┃      ┃      +  +
 *         ┃      ┃　　+
 *         ┃      ┗━━━┓ + +
 *         ┃          ┣┓
 *         ┃          ┏┛
 *         ┗┓┓┏━━━━┳┓┏┛ + + + +
 *          ┃┫┫  　┃┫┫
 *          ┗┻┛　  ┗┻┛+ + + +
 * ----------- 永 无 BUG ------------
 */
var _ = require("underscore");
var express = require("express");
var context = "node_modules/parsec-equuleus/";

module.exports = function (options) {
    var opts = _.extend({
        AV: require("leanengine"),
        app: express(),
        adminPath: "admin",
        prefix: "/equuleus"
    }, options);

    var app = opts.app;
    var prefix = opts.prefix;

    var router_promo = require("./router/promo")(options);
    var router_promo_phase = require("./router/promo-phase")(options);
    var router_promo_piece = require("./router/promo-piece")(options);
    var router_promo_grab = require("./router/promo-grab")(options);
    var router_promo_exchange = require("./router/promo-exchange")(options);

    // app.use(new RegExp(prefix + "/.*"), function (req, res, next) {
    //     console.log("TODO", "authenticate");
    //     next();
    // });

    app.use(prefix + "/promos", router_promo);
    app.use(prefix + "/phases", router_promo_phase);
    app.use(prefix + "/pieces", router_promo_piece);

    app.use(prefix + "/grab", router_promo_grab);
    app.use(prefix + "/exchange", router_promo_exchange);
};
