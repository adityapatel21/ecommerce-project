import Razorpay from "razorpay";
import prismadb from "@/lib/prismadb";

import { NextResponse } from "next/server";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY!,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  const { storeId } = params;
  const { productIds, totalPrice, phoneNumber, address } = await req.json();

  if (!productIds || productIds.length === 0) {
    return new NextResponse("Products ids are required", { status: 400 });
  }

  const products = await prismadb.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
  });

  const order = await prismadb.order.create({
    data: {
      storeId: params.storeId,
      isPaid: false,
      orderItems: {
        create: productIds.map((productId: string) => ({
          product: {
            connect: {
              id: productId,
            },
          },
        })),
      },
      address,
      phone: phoneNumber,
    },
  });

  console.log(parseFloat(totalPrice) * 100);
  var options = {
    amount: parseFloat(totalPrice) * 100,
    currency: "INR",
  };

  const razorpayOrder = await razorpay.orders.create(options);
  return NextResponse.json(
    { orderId: razorpayOrder.id },
    {
      headers: corsHeaders,
    }
  );
}
