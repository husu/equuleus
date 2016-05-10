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
    var PromoExPiece = AV.Object.extend("PromoExPiece");
    var PromoExMyPiece = AV.Object.extend("PromoExMyPiece");
    var _ = require("underscore");

    var PromoPieceService = {};

    function _save(data) {
        var o;
        if (data.objectId) {
            o = AV.Object.createWithoutData("PromoExPiece", data.objectId);
        } else {
            o = new PromoExPiece();
        }

        if (_.isString(data["promoEx"])) {
            data["promoEx"] = AV.Object.createWithoutData("PromoEx", data["promoEx"]);
            data["promoExId"] = data["promoEx"].id;
        }

        P.setOrUnsetAttributesOfObject([
            "promoEx", "enabled", "promoExId", "remark", "pieceType", "pieceUrl", "putAmount", "putTotalAmount", "unlimited"
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

        var query = new AV.Query(PromoExPiece);

        if (data["promoExId"]) {
            query.equalTo('promoExId', data["promoExId"]);
        }

        P.addSortToQuery(sort, query);
        if (paginationInfo)
            P.addPaginationToQuery(paginationInfo, query);

        return query.find().then(function (list) {
            return list;
        });
    }

    function _delete(id) {
        var o = AV.Object.createWithoutData("PromoExPiece", id);
        if (o) {
            return o.fetch().then(function (o) {
                var promo = o.get("promoEx");
                return o.destroy().then(function () {
                    _updatePromo(promo);
                    return arguments;
                });
            });
        } else {
            return AV.Promise.error("碎片不存在");
        }
    }

    function _deleteByPromoId(promoId) {
        return new AV.Query(PromoExPiece).equalTo("promoExId", promoId).destroyAll();
    }

    function _get(id) {
        var o = AV.Object.createWithoutData("PromoExPiece", id);
        if (o) {
            return o.fetch();
        } else {
            return AV.Promise.error("碎片不存在");
        }
    }

    function _generatePiece(uberId, phone, phase, duplicate) {
        var query = new AV.Query(PromoExPiece).equalTo("promoEx", phase.get("promoEx")).equalTo("enabled", true);
        if (!duplicate) {
            query.doesNotMatchKeyInQuery("objectId", "promoExPieceId", new AV.Query(PromoExMyPiece).equalTo("uberId", uberId));
        }
        return new AV.Query(PromoExMyPiece).equalTo("uberId", uberId).equalTo("promoExPhase", phase).count().then(function (count) {

            if (count >= phase.get("maxRepeat")) {
                return AV.Promise.error("该阶段最多只能抢" + phase.get("maxRepeat") + "次，您已经抢了" + count + "次。");
            } else {
                return query.find().then(function (pieces) {
                    if (!_.isEmpty(phase.get("allowedTypes"))) {
                        return _.filter(pieces, function (p) {
                            return phase.get("allowedTypes").indexOf(p.get("pieceType")) !== -1;
                        });
                    } else {
                        return pieces;
                    }
                }).then(function (pieces) {
                    if (_.isEmpty(pieces)) {
                        return AV.Promise.error("无法兑换碎片");
                    }

                    return pieces[_.random(pieces.length - 1)];
                }).then(function (piece) {

                    if (!piece.get("unlimited") && piece.get("putAmount") >= piece.get("putTotalAmount")) {
                        return AV.Promise.error("该碎片已兑换完毕");
                    }

                    var mine = PromoExMyPiece.new({
                        promoEx: phase.get("promoEx"),
                        promoExId: phase.get("promoEx").id,
                        promoExPhase: phase,
                        promoExPhaseId: phase.id,
                        promoExPiece: piece,
                        promoExPieceId: piece.id,
                        uberId: uberId,
                        phone: phone
                    });
                    piece.increment("putAmount");
                    piece.save();
                    return mine.save();
                });
            }
        });


    }

    function _myList(uberId, used) {
        return new AV.Query(PromoExMyPiece).equalTo("uberId", uberId).equalTo("used", used).include("promoExPiece").include("promoEx").find();
    }

    function _updatePromo(promo) {
        if (_.isString(promo)) {
            promo = AV.Object.createWithoutData("PromoEx", promo);
        }

        return new AV.Query(PromoExPiece).equalTo("promoEx", promo).equalTo("enabled", true).find().then(function (pieces) {

            //碎片中投放最少的同步为活动投放量
            var min = _.min(pieces, function (p) {
                return p.get("unlimited") ? Infinity : p.get("putTotalAmount");
            });
            promo.set("putTotalAmount", min === Infinity ? Infinity : min.get("putTotalAmount"));

            promo.set("pieceAmount", pieces.length);

            return promo.save();
        }).fail(function (e) {
            console.log("_updatePromo", e.code, e.message);
        });

    }

    PromoPieceService.save = _save;
    PromoPieceService.list = _list;
    PromoPieceService.delete = _delete;
    PromoPieceService.deleteByPid = _deleteByPromoId;
    PromoPieceService.get = _get;
    PromoPieceService.generatePiece = _generatePiece;
    PromoPieceService.myList = _myList;

    return PromoPieceService;
};
