/**
 * Created by Diluka on 2016-05-10.
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
module.exports = function (options) {
    var P = require("parsec-toolkit-for-leancloud");
    var express = require("express");
    var router = express();
    var util = require("util");

    var bodyParser = require('body-parser');
    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({extended: false}));

    var PromoService = require("../service/PromoService")(options);

    var ErrorCode = require("parsec-ursa").ErrorCode;
    var _ = require("underscore");

    router.post("/:promoId", function (req, res) {
        var promoId = req.params.promoId;
        var uberId = req.body.uberId;
        var phone = req.body.phone;

        PromoService.exchangePiecesToPromo(uberId, phone, promoId).then(function (result) {
            res.send(_.extend({}, ErrorCode.SUCCESS, {result: result}));
        }).fail(function (e) {
            res.send(_.extend({}, ErrorCode.FAILURE, {message: _.result(e, "message", e)}));
        });
    });


    return router;
};
