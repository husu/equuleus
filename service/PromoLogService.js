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
    var AV = options.AV;
    var PromoExLog = AV.Object.extend("PromoExLog");
    var _ = require("underscore");
    var moment = require("moment");

    var PromoLogService = {};

    function _log(req, myPiece) {
        var log = PromoExLog.new({
            ip: req.ip,
            uberId: req.body.uberId,
            phone: req.body.phone,
            promoId: req.params.promoId
        });
        if (myPiece) {
            log.set("pieceId", myPiece.get("promoExPieceId"));
            log.set("myPieceId", myPiece.id);
        }
        log.save().fail(function (e) {
            console.log("save promo log", e.code, e.message);
        });
    }

    PromoLogService.log = _log;

    return PromoLogService;
};
