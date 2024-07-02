"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import Button from "@/components/ui/button";
import Currency from "@/components/ui/currency";
import useCart from "@/hooks/use-cart";
import { Field, Input, Label } from "@headlessui/react";
import { tree } from "next/dist/build/templates/app-page";
import Script from "next/script";

const Summary = () => {
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const searchParams = useSearchParams();
  const items = useCart((state) => state.items);
  const removeAll = useCart((state) => state.removeAll);

  // useEffect(() => {
  //   if (searchParams.get("success")) {
  //     toast.success("Payment Successful");
  //     removeAll();
  //   }

  //   if (searchParams.get("canceled")) {
  //     toast.error("Something went Wrong");
  //   }
  // }, [searchParams, removeAll]);

  const totalPrice = items.reduce((total, item) => {
    return total + Number(item.price);
  }, 0);

  const onCheckout = async () => {
    // check if Address is Filled or not
    if (
      addressLine1.length === 0 ||
      addressLine2.length === 0 ||
      city.length === 0 ||
      state.length === 0 ||
      pincode.length == 0 ||
      phoneNumber.length == 0
    ) {
      toast.error("Please Fill the Address Details & Phone Number");
      return;
    }
    // Cheking pincode should be 6 digits
    if (pincode.length !== 6) {
      toast.error("Pincode should be 6 digits");
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/checkout`,
        {
          productIds: items.map((item) => item.id),
          totalPrice: String(Number(totalPrice) * 100),
          phoneNumber,
          address:
            addressLine1 +
            " " +
            addressLine2 +
            " " +
            city +
            " " +
            state +
            " " +
            pincode,
        }
      );

      if (response.statusText !== "OK") {
        throw new Error("Network response was not ok");
      }

      console.log(response);
      const razorPayOrderId = await response.data.orderId;
      console.log(razorPayOrderId);
      console.log(parseFloat(String(totalPrice)) * 100);

      try {
        const options = {
          key: process.env.RAZORPAY_API_KEY,
          amount: parseFloat(String(totalPrice)) * 100,
          currency: "INR",
          name: "My Happy Store", //busniess name
          description: "Test Payment",
          order_id: razorPayOrderId,
          handler: async function (response: any) {
            const data = {
              orderCreationId: razorPayOrderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            };

            const result = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/verify`,
              {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
              }
            );
            const res = await result.json();
            if (res.isOk) alert(res.message); //process further request after
            else {
              alert(res.message);
            }
          },
        };
        const paymentObject = new window.Razorpay(options);
        paymentObject.on("payment.failed", function (response: any) {
          alert(response.error.description);
        });

        paymentObject.open();
      } catch (error) {}
    } catch (error) {
      console.error(
        "There was a problem with your post checkout operation:",
        error
      );
    }
  };

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      <div className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8">
        <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="text-base font-medium text-gray-900">
              Order Total
            </div>
            <Currency value={totalPrice} />
          </div>
          <div className="mt-5 p-2">
            <h2 className="text-lg font-semibold text-gray-900 border-b p-2">
              Address
            </h2>
            <div>
              <label htmlFor="address_line_1">
                <h3 className="mt-2 text-sm font-medium">
                  Address Line 1*{"   "}
                </h3>
              </label>
              <input
                type="text"
                id="address_line_1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="House Number, Street Name"
                required
              />
            </div>
            <div>
              <label htmlFor="address_line_2">
                <h3 className="mt-2 text-sm font-medium">
                  Address Line 2*{"   "}
                </h3>
              </label>
              <input
                type="text"
                id="address_line_2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="Area/Colony Name"
                required
              />
            </div>
            <div>
              <label htmlFor="city">
                <h3 className="mt-2 text-sm font-medium">City*{"   "}</h3>
              </label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="City"
                required
              />
            </div>
            <div>
              <label htmlFor="state">
                <h3 className="mt-2 text-sm font-medium">State*{"   "}</h3>
              </label>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="State"
                required
              />
            </div>
            <div>
              <label htmlFor="pincode">
                <h3 className="mt-2 text-sm font-medium">PinCode*{"   "}</h3>
              </label>
              <input
                type="text"
                id="pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="Pincode"
                required
              />
            </div>
            <div>
              <label htmlFor="phoneNumber">
                <h3 className="mt-2 text-sm font-medium">
                  Phone Number*{"   "}
                </h3>
              </label>
              <input
                type="text"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                placeholder="Phone Number"
                required
              />
            </div>
          </div>

          <Button onClick={onCheckout} className="w-full mt-10">
            Checkout
          </Button>
        </div>
      </div>
    </>
  );
};

export default Summary;
