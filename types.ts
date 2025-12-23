
export interface Product {
  id: string;
  name: string;
  category: string;
  caseCost?: number;      // 整箱进价
  caseQuantity?: number;  // 整箱数量
  unitCost?: number;      // 单件成本
  caseWholesalePrice?: number; // 整箱批发价
  wholesalePrice?: number; // 单件批发价
  retailPrice?: number;    // 单件售价
  imageUrl?: string;      // 商品图片 (Base64)
  remarks?: string;       // 备注
  updatedAt: number;
}

export enum Category {
  FIREWORKS = '烟花',
  CRACKERS = '鞭炮',
  SMALL_FIREWORKS = '小烟花',
  OTHERS = '其他'
}

export interface Stats {
  totalItems: number;
  averageMargin: number;
  inventoryValue: number;
}
