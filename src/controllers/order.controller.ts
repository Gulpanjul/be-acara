import { Response } from "express";
import { IReqUser } from "../utils/interfaces";
import response from "../utils/response";
import OrderModel, { orderDAO, TypeOrder } from "../models/order.model";
import TicketModel from "../models/ticket.model";

export default {
    async create(req: IReqUser, res: Response) {
        try {
            const userId = req.user?.id;
            const payload = {
                ... req.body,
                createdBy: userId,
            } as TypeOrder;
            await orderDAO.validate(payload);

            const ticket = await TicketModel.findById(payload.ticket);
            if (!ticket) return response.notFound(res, "ticket not found");
            if (ticket.quantity < payload.quantity) {
                return response.error(res, null, "ticket quantity is not  enough");
            }

            const total: number = +ticket?.price * payload.quantity;

            Object.assign(payload, {
                ... payload,
                total,
            })

            const result = await OrderModel.create(payload);
            response.success(res, result, "success to create an order");
        } catch (error) {
            response.error(res, error, "failed to create an order");
        }
    },
    async findAll(req: IReqUser, res: Response) {},
    async findOne(req: IReqUser, res: Response) {},
    async findAllByMember(req: IReqUser, res: Response) {},

    async complete(req: IReqUser, res: Response) {},
    async pending(req: IReqUser, res: Response) {},
    async cancelled(req: IReqUser, res: Response) {},
}