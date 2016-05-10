/**
 * Created by Diluka on 2016-05-09.
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
    "use strict";
    var P = require("parsec-toolkit-for-leancloud");
    var express = require("express");
    var router = express();
    var util = require("util");

    var bodyParser = require('body-parser');
    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({extended: false}));

    var PromoPhaseService = require("../service/PromoPhaseService")(options);

    var ErrorCode = require("parsec-ursa").ErrorCode;
    var _ = require("underscore");

    router.post("/", function (req, res) {
        var data = req.body;

        //转数字
        P.convertKeysToInt([
            "enabled","maxRepeat"
        ], data);
        //转日期
        P.convertKeysToDate(["startTime", "endTime"], data);

        if (data["objectId"]) {
            //修改
        } else {
            //新增
            var formErrors = P.fieldRequiredCheck([
                "startTime", "endTime", "promoId"
            ], data, {
                "promoId": "活动ID",
                "startTime": "开始时间",
                "endTime": "结束时间"
            });
            if (formErrors) {
                return res.send(_.extend({}, ErrorCode.FORM_DATA_INVALID, {errors: formErrors}));
            }
        }

        data["promoEx"] = data["promoId"];
        if (util.isNumber(data["enabled"])) {
            data["enabled"] = !!data["enabled"];
        }


        PromoPhaseService.save(data).then(P.formatDate("YYYY-MM-DD HH:mm")).then(function (o) {
            return res.send(_.extend({}, ErrorCode.SUCCESS, {object: o}));
        }).fail(function (e) {
            res.send(_.extend({}, ErrorCode.UNHANDLED_ERROR, {internalError: e}));
        });
    });

    router.get("/", function (req, res) {

        var pageInfo = {
            start: parseInt(req.query["start"]),
            size: parseInt(req.query["size"]),
            pageIndex: parseInt(req.query["pageIndex"])
        };

        var query = {};

        if (req.query["promoId"]) {
            query["promoId"] = req.query["promoId"];
        }

        PromoPhaseService.list(query, req.query.sort || ["-createdAt"], pageInfo).then(P.formatDate("YYYY-MM-DD HH:mm")).then(function (list) {
            return res.send(_.extend({}, ErrorCode.SUCCESS, {list: list}));
        }).fail(function (e) {
            return res.send(_.extend({}, ErrorCode.UNHANDLED_ERROR, {internalError: e}));
        });
    });

    router.delete("/:id", function (req, res) {
        PromoPhaseService.delete(req.params.id).then(function (o) {
            return res.send(_.extend({}, ErrorCode.SUCCESS, {object: o}));
        }).fail(function (e) {
            res.send(_.extend({}, ErrorCode.UNHANDLED_ERROR, {internalError: e}));
        });
    });

    router.get("/:id", function (req, res) {
        PromoPhaseService.get(req.params.id).then(function (o) {
            return res.send(_.extend({}, ErrorCode.SUCCESS, {object: o}));
        }).fail(function (e) {
            res.send(_.extend({}, ErrorCode.UNHANDLED_ERROR, {internalError: e}));
        });
    });

    return router;
};
