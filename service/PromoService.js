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
    var AV = options.AV;
    var PromoEx = AV.Object.extend("PromoEx");
    var PromoExGainer = AV.Object.extend("PromoExGainer");
    var _ = require("underscore");
    var moment = require("moment");

    var PromoPhaseService = require("./PromoPhaseService")(options);
    var PromoPieceService = require("./PromoPieceService")(options);

    var PromoService = {};

    PromoService.save = function (data) {
        var promo;
        if (data.objectId) {
            promo = AV.Object.createWithoutData("PromoEx", data.objectId);
        } else {
            promo = new PromoEx();
        }

        P.setOrUnsetAttributesOfObject([
            "activityName", "enabled", "magicEnvelope", "startTime", "phaseAmount",
            "pieceAmount", "putAmount", "endTime", "putTotalAmount", "sortNo",
            "remark"
        ], data, promo);

        return promo.save();

    };

    PromoService.list = function (data, sort, paginationInfo) {
        data = data || {};
        sort = sort || [];

        var query = new AV.Query(PromoEx);

        if (data["activityName"]) {
            query.contains('activityName', data["activityName"]);
        }
        if (_.isDate(data["now"])) {
            query.lessThanOrEqualTo('startTime', data["now"]);
            query.greaterThanOrEqualTo('endTime', data["now"]);
        }
        if (_.isBoolean(data["enabled"])) {
            query.equalTo('enabled', data["enabled"]);
        }

        P.addSortToQuery(sort, query);
        if (paginationInfo)
            P.addPaginationToQuery(paginationInfo, query);

        return query.find().then(function (list) {

            return list;
        });
    };

    PromoService.delete = function (id) {
        var o = AV.Object.createWithoutData("PromoEx", id);
        if (o) {
            return PromoPhaseService.deleteByPid(id).then(function () {
                return o.destroy();
            });
        } else {
            return AV.Promise.error("活动不存在");
        }
    };

    PromoService.get = function (id) {
        var o = AV.Object.createWithoutData("PromoEx", id);
        if (o) {
            return o.fetch();
        } else {
            return AV.Promise.error("活动不存在");
        }
    };

    PromoService.grab = function (uberId, phone, promoId) {
        var now = moment();
        var errorMsg = "活动不存在或者未在活动进行时间";

        return PromoService.get(promoId).then(function (promo) {
            if (promo.get("enabled") && (moment(promo.get("startTime")).isBefore(now) && moment(promo.get("endTime")).isAfter(now))) {
                //初步判断活动有效

                //只取第一个，如果有多个说明配置错误
                return PromoPhaseService.list({
                    now: new Date(),
                    enabled: true,
                    promoEx: promo
                }, ["-createdAt"], {size: 1}).then(function (phase) {
                    if (_.isEmpty(phase)) {
                        return AV.Promise.error(errorMsg);
                    } else {
                        return PromoPieceService.generatePiece(uberId, phone, phase[0], false).then(function (myPiece) {
                            return myPiece;
                        });
                    }
                });
            } else {
                //活动无效
                return AV.Promise.error(errorMsg);
            }
        });

    };

    function _exchangePiecesToPromo(uberId, phone, promoId) {
        return AV.Promise.when(PromoService.get(promoId), PromoPieceService.myList(uberId, false)).then(function (promo, mines) {

            var piecesGroup = _.groupBy(mines, function (mine) {
                return mine.get("promoExPiece").get("pieceType");
            });
            console.dir(piecesGroup);
            console.log(promo);
            if (promo.get("pieceAmount") === _.keys(piecesGroup).length) {
                var changeList = [];

                _.each(piecesGroup, function (list) {
                    var p = _.first(list);
                    p.set("used", true);
                    changeList.push(p);
                });

                var gainer = PromoExGainer.new({
                    uberId: uberId,
                    phone: phone,
                    promoExId: promoId,
                    promoEx: promo
                });

                changeList.push(gainer);

                promo.increment("putAmount");

                changeList.push(promo);


                return AV.Object.saveAll(changeList).then(function () {
                    return true;
                });
            } else {
                return false;
            }
        });
    }

    PromoService.exchangePiecesToPromo = _exchangePiecesToPromo;


    return PromoService;
};
