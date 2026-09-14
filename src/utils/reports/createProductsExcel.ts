import XLSX from 'xlsx';

interface IProductsExcelReport {
  products: Array<any>;
  generatedAt?: Date;
}

const unidadLabel = (unidad: number | null | undefined) => {
  if (unidad === 0) return 'Unidad';
  if (unidad === 1) return 'Kg';
  return '';
};

const enabledLabel = (enabled: number | boolean | null | undefined) => {
  return Number(enabled) === 1 ? 'Habilitado' : 'Deshabilitado';
};

const fixedSaleLabel = (vtaFija: number | boolean | null | undefined) => {
  return Number(vtaFija) === 1 ? 'Si' : 'No';
};

const roundNumber = (value: number) => Math.round(value * 100) / 100;

export const createProductsExcel = ({
  products,
  generatedAt = new Date(),
}: IProductsExcelReport) => {
  const workbook = XLSX.utils.book_new();

  const productRows = products.map((product) => {
    const precioCompra = Number(product.precio_compra || 0);
    const iva = Number(product.iva || 0);
    const precioVenta = Number(product.vta_price || 0);
    const margenBruto =
      precioCompra || precioVenta
        ? roundNumber(precioVenta - precioCompra * (1 + iva / 100))
        : '';

    return {
      ID: product.id,
      'Fecha carga': product.fecha_carga,
      'Codigo barra': product.cod_barra,
      Producto: product.name,
      'Descripcion corta': product.short_descr,
      Estado: enabledLabel(product.enabled),
      Proveedor: product.category,
      Marca: product.subcategory,
      Unidad: unidadLabel(product.unidad),
      'Precio compra': product.precio_compra,
      'IVA %': product.iva,
      '% margen minorista': product.porc_minor,
      'Precio venta': product.vta_price,
      Descuento: product.discount,
      'Venta fija': fixedSaleLabel(product.vta_fija),
      'Margen bruto estimado': margenBruto,
      'Ultima actualizacion': product.update_time,
    };
  });

  const summaryRows = [
    { Indicador: 'Generado', Valor: generatedAt.toISOString() },
    { Indicador: 'Total productos', Valor: products.length },
    {
      Indicador: 'Habilitados',
      Valor: products.filter((product) => Number(product.enabled) === 1).length,
    },
    {
      Indicador: 'Deshabilitados',
      Valor: products.filter((product) => Number(product.enabled) !== 1).length,
    },
  ];

  const byProvider = products.reduce((acc: any, product) => {
    const provider = product.category || '(Sin proveedor)';
    if (!acc[provider]) {
      acc[provider] = {
        Proveedor: provider,
        Productos: 0,
        Habilitados: 0,
        Deshabilitados: 0,
      };
    }
    acc[provider].Productos += 1;
    if (Number(product.enabled) === 1) {
      acc[provider].Habilitados += 1;
    } else {
      acc[provider].Deshabilitados += 1;
    }
    return acc;
  }, {});

  const productsSheet = XLSX.utils.json_to_sheet(productRows);
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  const providerSheet = XLSX.utils.json_to_sheet(Object.values(byProvider));

  productsSheet['!cols'] = [
    { wch: 8 },
    { wch: 20 },
    { wch: 18 },
    { wch: 44 },
    { wch: 50 },
    { wch: 15 },
    { wch: 24 },
    { wch: 24 },
    { wch: 12 },
    { wch: 16 },
    { wch: 10 },
    { wch: 18 },
    { wch: 16 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Productos');
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
  XLSX.utils.book_append_sheet(workbook, providerSheet, 'Proveedores');

  return XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });
};
