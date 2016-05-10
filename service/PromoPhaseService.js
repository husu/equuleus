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
    var AV = options.AV;
    var PromoExPhase = AV.Object.extend("PromoExPhase");
    var _ = require("underscore");

    var PromoPhaseService = {};

    function _save(data) {
        var o;
        if (data.objectId) {
            o = AV.Object.createWithoutData("PromoExPhase", data.objectId);
        } else {
            o = new PromoExPhase();
        }

        if (_.isString(data["promoEx"])) {
            data["promoEx"] = AV.Object.createWithoutData("PromoEx", data["promoEx"]);
            data["promoExId"] = data["promoEx"].id;
        }
        if (_.isString(data["allowedTypes"])) {
            data["allowedTypes"] = data["allowedTypes"].split(",");
            var types = [];
            for (var i = 0; i < data["allowedTypes"].length; i++) {
                var type = parseInt(data["allowedTypes"][i]);
                if (type || type === 0) {
                    types.push(type);
                }
            }
            data["allowedTypes"] = types;
        }

        P.setOrUnsetAttributesOfObject([
            "promoEx", "enabled", "promoExId", "startTime", "endTime", "remark", "allowedTypes", "maxRepeat"
        ], data, o);

        return o.save().then(function (o) {
            o.fetch().then(function (o) {
                _updatePromo(o.get("promoEx"));
            });

            return o;
        });
    }

    function _list(data, sort, paginationInfo) {
        data = data || {};
        sort = sort || [];

        var query = new AV.Query(PromoExPhase);

        if (data["promoExId"]) {
            query.equalTo('promoExId', data["promoExId"]);
        }
        if (_.isDate(data["now"])) {
            query.lessThanOrEqualTo('startTime', data["now"]);
            query.greaterThanOrEqualTo('endTime', data["now"]);
        }
        if (_.isBoolean(data["enabled"])) {
            query.equalTo('enabled', data["enabled"]);
        }
        if (data["promoEx"]) {
            query.equalTo('promoEx', data["promoEx"]);
        }

        P.addSortToQuery(sort, query);
        if (paginationInfo)
            P.addPaginationToQuery(paginationInfo, query);

        return query.find().then(function (list) {
            return list;
        });
    }

    function _delete(id) {
        var o = AV.Object.createWithoutData("PromoExPhase", id);
        if (o) {
            return o.fetch().then(function (o) {
                var promo = o.get("promoEx");
                return o.destroy().then(function () {
                    _updatePromo(promo);
                    return arguments;
                });
            });
        } else {
            return AV.Promise.error("活动阶段不存在");
        }
    }

    function _deleteByPromoId(promoId) {
        return new AV.Query(PromoExPhase).equalTo("promoExId", promoId).destroyAll();
    }

    function _get(id) {
        var o = AV.Object.createWithoutData("PromoExPhase", id);
        if (o) {
            return o.fetch();
        } else {
            return AV.Promise.error("活动阶段不存在");
        }
    }

    function _updatePromo(promo) {

        if (_.isString(promo)) {
            promo = AV.Object.createWithoutData("PromoEx", promo);
        }

        return new AV.Query(PromoExPhase).equalTo("promoEx", promo).equalTo("enabled", true).find().then(function (phases) {
            var endTime = _.max(phases, function (p) {
                return p.get("endTime").getTime();
            });
            var startTime = _.min(phases, function (p) {
                return p.get("startTime").getTime();
            });

            promo.set("endTime", endTime === -Infinity ? null : endTime.get("endTime"));
            promo.set("startTime", startTime === Infinity ? null : startTime.get("startTime"));
            promo.set("phaseAmount", phases.length);

            return promo.save();
        }).fail(function (e) {
            console.log("_updatePromo", e.code, e.message);
        });

    }

    PromoPhaseService.save = _save;
    PromoPhaseService.list = _list;
    PromoPhaseService.delete = _delete;
    PromoPhaseService.deleteByPid = _deleteByPromoId;
    PromoPhaseService.get = _get;

    return PromoPhaseService;
};
