import { IChangeStock, Ipages, IWhereParams } from 'interfaces/Ifunctions';
import { INewStock } from 'interfaces/Irequests';
import { IDetFactura, IModPriceProd, IMovStock, IUser } from 'interfaces/Itables';
import moment from 'moment';
import { EConcatWhere, EModeWhere, ESelectFunct } from '../../../enums/EfunctMysql';
import { Tables, Columns } from '../../../enums/EtablesDB';
import StoreType from '../../../store/mysql';

export = (injectedStore: typeof StoreType) => {
    let store = injectedStore;

    const list = async (idPv: number, idProd: number) => {
        let filter: IWhereParams | undefined = undefined;
        let filters: Array<IWhereParams> = [];

        filter = {
            mode: EModeWhere.strict,
            concat: EConcatWhere.and,
            items: [
                { column: Columns.stock.id_prod, object: String(idProd) }
            ]
        };
        filters.push(filter);

        let stockvar: Array<any> = [];
        filter = {
            mode: EModeWhere.strict,
            concat: EConcatWhere.and,
            items: [
                { column: Columns.stock.id_prod, object: String(idProd) },
                { column: Columns.stock.pv_id, object: String(idPv) }
            ]
        };
        filters.push(filter);
        const nuevo = await store.list(Tables.STOCK, [`${ESelectFunct.sum}(${Columns.stock.cant}) as cant`], filters, undefined, undefined, undefined);
        const item = {
            stock: nuevo[0].cant === null ? 0 : nuevo[0].cant,
            variedad: false
        };
        stockvar.push(item)
        return stockvar;
    }

    const ultimosMovStock = async (idPv: number, idProd: number) => {
        let filter: IWhereParams | undefined = undefined;
        let filters: Array<IWhereParams> = [];
        filter = {
            mode: EModeWhere.strict,
            concat: EConcatWhere.and,
            items: [
                { column: Columns.stock.id_prod, object: String(idProd) },
                { column: Columns.stock.pv_id, object: String(idPv) }
            ]
        };

        const orderBy: Ipages = {
            currentPage: 1,
            order: Columns.stock.fecha,
            cantPerPage: 20,
            asc: false
        }

        filters.push(filter);
        return await store.list(Tables.STOCK, [ESelectFunct.all], filters, undefined, orderBy, undefined);
    }

    const upsert = async (body: INewStock, user: IUser) => {
        const newMov: IMovStock = {
            fecha: new Date(),
            id_prod: body.idProd,
            pv_id: body.pv_id,
            cant: body.nvoStockSingle,
            venta: false,
            nro_remito: body.obs,
            costo: (body.costo) * (body.nvoStockSingle),
            iva: body.iva,
            id_user: user.id
        };

        const NewPriceProd: IModPriceProd = {
            id: body.idProd,
            vta_fija: body.vta_fija,
            vta_price: body.vta_price,
            round: body.round,
            porc_minor: body.porc_minor,
            precio_compra: body.precio_compra
        };

        await store.update(Tables.PRODUCTS_PRINCIPAL, NewPriceProd, body.idProd);

        return await store.insert(Tables.STOCK, newMov);
    }

    const multipleInsertStock = async (prodList: Array<IDetFactura>, userId: number, pvId: number, factId: number) => {

        const headers: Array<string> = [
            Columns.stock.fecha,
            Columns.stock.id_prod,
            Columns.stock.pv_id,
            Columns.stock.cant,
            Columns.stock.venta,
            Columns.stock.nro_remito,
            Columns.stock.costo,
            Columns.stock.iva,
            Columns.stock.id_user,
            Columns.stock.id_fact

        ]
        const rows: Promise<Array<Array<any>>> = new Promise((resolve, reject) => {
            const rowsvalues: Array<Array<any>> = []
            prodList.map((item, key) => {
                const values = []
                values.push(moment(new Date()).format("YYYY-MM-DD HH:mm:ss"))
                values.push(item.id_prod)
                values.push(pvId)
                values.push(- item.cant_prod)
                values.push(1)
                values.push("Venta Stock")
                values.push(0)
                values.push(item.alicuota_id)
                values.push(userId)
                values.push(factId)
                rowsvalues.push(values)
                if (key === prodList.length - 1) {
                    resolve(rowsvalues)
                }
            })
        })
        try {
            const resultinsert = store.mInsert(Tables.STOCK, { headers: headers, rows: await rows })
            return {
                status: 200,
                msg: resultinsert
            }
        } catch (error) {
            throw new Error(String(error))
        }
    }

    const remove = async (id: number) => {
        await store.remove(Tables.STOCK, { id: id })
    }

    const get = async (id: number) => {
        return await store.get(Tables.STOCK, id)
    }

    const moverStock = async (body: IChangeStock, user: IUser) => {
        const destino: INewStock = body.destino
        const origen: INewStock = body.origen
        const result1 = await upsert(origen, user)
        const result2 = await upsert(destino, user)
        return {
            result1,
            result2
        }
    }

    return {
        list,
        upsert,
        remove,
        get,
        ultimosMovStock,
        moverStock,
        multipleInsertStock
    }
}
