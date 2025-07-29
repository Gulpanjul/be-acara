import { Response } from "express";
import { IReqUser } from "../utils/interfaces";
import response from "../utils/response";
import OrderModel, { orderDAO, TypeOrder } from "../models/order.model";
import TicketModel from "../models/ticket.model";
import { FilterQuery } from "mongoose";

export default {
    async create(req: IReqUser, res: Response) {
        try {
            const userId = req.user?.id;
            const payload = {
                ...req.body,
                createdBy: userId,
            } as TypeOrder;
            await orderDAO.validate(payload);

            const ticket = await TicketModel.findById(payload.ticket);
            if (!ticket) return response.notFound(res, "ticket not found");
            if (ticket.quantity < payload.quantity) {
                return response.error(
                    res,
                    null,
                    "ticket quantity is not  enough"
                );
            }

            const total: number = +ticket?.price * payload.quantity;

            Object.assign(payload, {
                ...payload,
                total,
            });

            const result = await OrderModel.create(payload);
            response.success(res, result, "success to create an order");
        } catch (error) {
            response.error(res, error, "failed to create an order");
        }
    },
    async findAll(req: IReqUser, res: Response) {
        try {
            const buildQuery = (filter: any) => {
                let query: FilterQuery<TypeOrder> = {};

                if (filter.search) query.$text = { $search: filter.search };

                return query;
            };

            const { limit = 10, page = 1, search } = req.query;

            const query = buildQuery({
                search,
            });

            const result = await OrderModel.find(query)
                .limit(+limit)
                .skip((+page - 1) * +limit)
                .sort({ createdAt: -1 })
                .lean()
                .exec();
            const count = await OrderModel.countDocuments(query);

            response.pagination(
                res,
                result,
                {
                    current: +page,
                    total: count,
                    totalPages: Math.ceil(count / +limit),
                },
                "success find all orders"
            );
        } catch (error) {
            response.error(res, error, "failed find all orders");
        }
    },
    async findOne(req: IReqUser, res: Response) {
        try {
            const { orderId } = req.params;
            const result = await OrderModel.findOne({
                orderId,
            });

            if (!result) return response.notFound(res, "order not found");

            response.success(res, result, "success to find one an order");
        } catch (error) {
            response.error(res, error, "failed to find one order");
        }
    },
    async findAllByMember(req: IReqUser, res: Response) {},

    async complete(req: IReqUser, res: Response) {},
    async pending(req: IReqUser, res: Response) {},
    async cancelled(req: IReqUser, res: Response) {},
};
