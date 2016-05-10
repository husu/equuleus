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

    router.post("/", function (req, res) {
        var data = req.body;

        //转数字
        P.convertKeysToInt([
            "phaseAmount", "pieceAmount", "putAmount", "putTotalAmount", "sortNo", "enabled"
        ], data);
        //转日期
        P.convertKeysToDate(["startTime", "endTime"], data);

        if (data["objectId"]) {
            //修改
        } else {
            //新增
            var formErrors = P.fieldRequiredCheck([
                "activityName", "magicEnvelope", "phaseAmount", "pieceAmount"
            ], data, {
                "activityName": "活动名称",
                // "startTime": "开始时间",
                // "endTime": "结束时间",
                "phaseAmount": "活动次数",
                "pieceAmount": "碎片数"
            });
            if (formErrors) {
                return res.send(_.extend({}, ErrorCode.FORM_DATA_INVALID, {errors: formErrors}));
            }
        }

        if (util.isNumber(data["enabled"])) {
            data["enabled"] = !!data["enabled"];
        }


        PromoService.save(data).then(P.formatDate("YYYY-MM-DD HH:mm")).then(function (o) {
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

        if (req.query["activityName"]) {
            query["activityName"] = req.query["activityName"];
        }

        PromoService.list(query, req.query.sort || ["-createdAt"], pageInfo).then(P.formatDate("YYYY-MM-DD HH:mm")).then(function (list) {
            return res.send(_.extend({}, ErrorCode.SUCCESS, {list: list}));
        }).fail(function (e) {
            return res.send(_.extend({}, ErrorCode.UNHANDLED_ERROR, {internalError: e}));
        });
    });

    router.delete("/:id", function (req, res) {
        PromoService.delete(req.params.id).then(function (o) {
            return res.send(_.extend({}, ErrorCode.SUCCESS, {object: o}));
        }).fail(function (e) {
            res.send(_.extend({}, ErrorCode.UNHANDLED_ERROR, {internalError: e}));
        });
    });

    router.get("/:id", function (req, res) {
        PromoService.get(req.params.id).then(function (o) {
            return res.send(_.extend({}, ErrorCode.SUCCESS, {object: o}));
        }).fail(function (e) {
            res.send(_.extend({}, ErrorCode.UNHANDLED_ERROR, {internalError: e}));
        });
    });


    return router;
};
