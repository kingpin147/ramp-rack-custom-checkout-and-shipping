import { myGetCurrentCartFunction } from 'backend/currentCart.web';
import { createMyOrder, updateMyOrderPaymentStatus } from 'backend/order.web';
import { createMyPayment } from 'backend/wixPay.web';
import wixEcomFrontend from "wix-ecom-frontend";
import wixPay from "wix-pay";
import wixData from "wix-data";

let items;

const shippingFreightData = [
    { name: '6" Oval light for Xtreme and ST-100 models EACH', shipping_freight: 8.99 },
    { name: 'AA101 - Truck Rail System', shipping_freight: 24.95 },
    { name: 'Aluminum Block Kit - Xtreme Pro Series', shipping_freight: 5.95 },
    { name: 'BLACK BPS100 V3.3 Blower Rack', shipping_freight: 29.95 },
    { name: 'BLACK FCL100- 5 Gal Fuel Cage Lockable Gas Can Rack', shipping_freight: 24.95 },
    { name: 'BLACK FCS200-2.5 Gal. Fuel Cage Lockable Gas Can Rack', shipping_freight: 24.95 },
    { name: 'BLACK SPC21-Xtreme Pro Series Sprayer Cage', shipping_freight: 29.95 },
    { name: 'BLACK TA051 Hand Tool Rack', shipping_freight: 19.95 },
    { name: 'BLACK XA102 (V3)-Xtreme Pro Series Two Position Trimmer Rack', shipping_freight: 22.95 },
    { name: 'BLACK XB103 (V3) Xtreme Pro Series Three Position Trimmer Rack', shipping_freight: 24.95 },
    { name: 'BPS 100 V3.3 Blower Rack', shipping_freight: 29.95 },
    { name: 'FCL100- 5 Gal Fuel Cage Lockable Gas Can Rack', shipping_freight: 24.95 },
    { name: 'FCS200-2.5 Gal. Fuel Cage Lockable Gas Can Rack', shipping_freight: 24.95 },
    { name: 'MTB-100: Modified Trimmer Rack Bracket', shipping_freight: 19.99 },
    { name: 'NDB-100 NO DRILL ACCESSORY BRACKET', shipping_freight: 19.99 },
    { name: 'PU-100 : Standard 1500-3500 Pickup', shipping_freight: '6 Options (100 lbs or more)' },
    { name: 'PU-200 : Front Rack 1500-3500 Pickup', shipping_freight: '6 Options (100 lbs or more)' },
    { name: 'PU-300 : Headache Rack 1500-3500 Pickup', shipping_freight: '6 Options (100 lbs or more)' },
    { name: 'QD-100 Quick Disconnect 1500-3500 Pickup', shipping_freight: 39.99 },
    { name: 'QD-200: Quick Disconnect for Specialty Truck Unit', shipping_freight: 29.95 },
    { name: 'SPC21-Xtreme Pro Series Sprayer Cage', shipping_freight: 29.95 },
    { name: 'Sport', shipping_freight: '6 Options (100 lbs or more)' },
    { name: 'ST-100 : Specialty Truck Unit', shipping_freight: '6 Options (100 lbs or more)' },
    { name: 'TA051 Hand Tool Rack', shipping_freight: 19.95 },
    { name: 'Wheel Well Ramp WWR-100', shipping_freight: '6 Options (100 lbs or more)' },
    { name: 'XA102 (V3) Xtreme Pro Series Two Position Trimmer Rack', shipping_freight: 22.95 },
    { name: 'XB103 (V3) Xtreme Pro Series Three Position Trimmer Rack', shipping_freight: 24.95 },
    { name: 'XD105 Line Spool Rack w/ Cutter', shipping_freight: 10.95 }
];

const shippingOptions = [
    { name: 'Self Pickup at Falling Waters, WV (No Cost)', cost: 0 },
    { name: 'Ship to my nearest Terminal for Pickup', cost: 395.0 },
    { name: 'Ship to a Commercial Location', cost: 395.0 },
    { name: 'Ship to a Commercial Location + Liftgate Service', cost: 465.0 },
    { name: 'Ship to a Residential Location', cost: 495.0 },
    { name: 'Ship to a Residential Location + Liftgate Service', cost: 565.0 }
];

$w.onReady(async () => {
    $w('#orderSummary').collapse();
    await loadCartAndBind(); // Load initially

    // Listen for any changes in the cart
    wixEcomFrontend.onCartChange(async () => {
        console.log("Cart changed — refreshing cart items...");
        await loadCartAndBind(); // Reload and re-render cart when it changes
    });
});

async function loadCartAndBind() {
    await myGetCurrentCartFunction()
        .then(cart => {
            items = cart.lineItems;
            console.log(items); // Check the items in cart
            if (items) { $w('#orderSummary').expand(); }

            // Extract currency symbol (e.g. “€” or “$”) from subtotal formattedAmount
            const currencySymbol = (cart.subtotal.formattedAmount.match(/^(\D+)/) || [''])[0] || '$';

            // 1) Build repeater data and compute numeric totals
            let sumTotal = 0;
            const repeaterData = items.map(item => {
                const qty = item.quantity;
                const unitAmt = parseFloat(item.price.amount); // e.g. "10" → 10
                const lineTot = unitAmt * qty; // line total
                sumTotal += lineTot;

                return {
                    _id: item._id,
                    productImage: item.image,
                    productName: item.productName.original,
                    productQty: `Qty: ${qty}`,
                    productPrice: item.price.formattedConvertedAmount
                };
            });

            // 2) Bind into your repeater
            $w('#productRepeater').data = repeaterData;
            $w('#productRepeater').onItemReady(($item, itemData) => {
                $item('#productImage').src = itemData.productImage;
                $item('#productName').text = itemData.productName;
                $item('#productQty').text = itemData.productQty;
                $item('#productPrice').text = itemData.productPrice;
            });

            // 3) Calculate and show totals
            const formattedSubTotal = `${currencySymbol}${sumTotal.toFixed(2)}`;
            const formattedDelivery = `${currencySymbol}0.00`; // placeholder
            const formattedGrandTotal = `${currencySymbol}${(sumTotal + 0).toFixed(2)}`;

            $w('#subTotal').text = formattedSubTotal;
            $w('#deliveryAmount').text = formattedDelivery;
            $w('#grandTotal').text = formattedGrandTotal;
            // List of U.S. states excluding Alaska, Hawaii, and Puerto Rico
            const states = [
                'Alabama', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida',
                'Georgia', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
                'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska',
                'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
                'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
                'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
            ];

            // Populate the dropdown with the states in alphabetical order
            $w('#stateDropdown').options = states.sort().map(state => ({
                label: state,
                value: state
            }));

            $w('#continueButton').onClick(() => {
                const customerDetails = {
                    email: $w('#emailInput').value,
                    firstName: $w('#firstNameInput').value,
                    lastName: $w('#lastNameInput').value,
                    phone: $w('#phoneInput').value,
                };

                const deliveryDetails = {
                    country: $w('#countryDropdown').value,
                    address: $w('#addressInput').value,
                    city: $w('#cityInput').value,
                    state: $w('#stateDropdown').value,
                    zip: $w('#zipInput').value,
                };

                console.log("Customer:", customerDetails);
                console.log("Delivery:", deliveryDetails);

                // 4) Find if any product has '6 Options (100 lbs or more)' and process dropdown
                const dropdownOptions = items.map(item => {
                    const product = shippingFreightData.find(p => normalizeName(p.name) === normalizeName(item.productName.original));

                    if (product) {
                        if (product.shipping_freight === '6 Options (100 lbs or more)') {
                            return shippingOptions.map(option => ({
                                label: option.name,
                                value: option.cost.toString() // Ensure value is a string
                            }));
                        } else {
                            // If product doesn't have '6 Options', push its price to dropdown
                            return [{
                                label: `$${product.shipping_freight}`,
                                value: product.shipping_freight.toString() // Ensure value is a string
                            }];
                        }
                    }
                }).flat(); // Flatten array to avoid nesting

                // If there's a "6 Options" product, don't show others
                const has6Options = items.some(item => {
                    const product = shippingFreightData.find(p => normalizeName(p.name) === normalizeName(item.productName.original));
                    return product && product.shipping_freight === '6 Options (100 lbs or more)';
                });

                let selectedShippingOption = 0;

                if (has6Options) {
                    // Filter out any other options and only show the ones for 6 Options
                    $w('#shippingDropdown').options = shippingOptions.map(option => ({
                        label: option.name,
                        value: option.cost.toString()
                    }));
                } else {
                    // If no "6 Options" found, find the highest price and use it
                    const highestPriceOption = dropdownOptions.sort((a, b) => parseFloat(b.value) - parseFloat(a.value))[0];
                    selectedShippingOption = highestPriceOption.value;

                    // Set the dropdown to show the highest priced option
                    $w('#shippingDropdown').options = [{
                        label: `$${selectedShippingOption}`,
                        value: selectedShippingOption.toString()
                    }];
                }

                // Update delivery cost and total on selection
                $w('#shippingDropdown').onChange((event) => {
                    const selectedValue = parseFloat(event.target.value);
                    const deliveryCost = selectedValue;
                    const newTotal = sumTotal + deliveryCost;

                    // Update the UI with the new delivery cost and total
                    $w('#deliveryAmount').text = `${currencySymbol}${deliveryCost.toFixed(2)}`;
                    $w('#grandTotal').text = `${currencySymbol}${newTotal.toFixed(2)}`;
                });
                $w('#shipping').expand();
                $w('#customerContainer').collapse();
            });

            $w('#paymentButton').onClick(async () => {
                try {
                    const currentCart = await myGetCurrentCartFunction();
                    items = currentCart.lineItems;
                    const currency = cart.currency;
                    let sumTotal = 0;

                    const shippingValue = $w('#shippingDropdown').value;
                    if (!shippingValue || isNaN(parseFloat(shippingValue))) {
                        console.error("❌ Please select a valid shipping option before proceeding.");
                        return;
                    }
                    const shippingCost = parseFloat(shippingValue);

                    const lineItems = items.map(item => {
                        const qty = item.quantity;
                        const unitPrice = parseFloat(item.price.amount);
                        const lineTotal = unitPrice * qty;
                        sumTotal += lineTotal;

                        const name = item.productName?.original || item.productName || item.name;

                        return {
                            itemType: {
                                preset: "PHYSICAL"
                            },
                            catalogReference: {
                                catalogItemId: item.catalogReference.catalogItemId,
                                appId: "215238eb-22a5-4c36-9e7b-e7c08025e04e"
                            },
                            productName: {
                                original: name,
                                translated: name
                            },
                            quantity: qty,
                            price: {
                                amount: unitPrice.toFixed(2),
                                currency
                            },
                            totalPrice: {
                                amount: lineTotal.toFixed(2),
                                currency
                            },
                            taxInfo: {
                                taxIncludedInPrice: false,
                                rate: "0.00",
                                amount: {
                                    amount: "0.00",
                                    currency
                                }
                            },
                        };
                    });

                    console.log(lineItems);

                    const grandTotal = sumTotal + shippingCost;

                    const paymentItems = [
                        ...lineItems.map(item => ({
                            name: item.productName.original,
                            price: parseFloat(item.totalPrice.amount)
                        })),
                        { name: "Shipping", price: shippingCost }
                    ];

                    const recipientInfo = {
                        address: {
                            country: "US",
                            city: $w('#cityInput').value,
                            subdivision: $w('#stateDropdown').value,
                            postalCode: $w('#zipInput').value,
                            addressLine: $w('#addressInput').value
                        },
                        contactDetails: {
                            firstName: $w('#firstNameInput').value,
                            lastName: $w('#lastNameInput').value,
                            email: $w('#emailInput').value,
                            phone: $w('#phoneInput').value
                        }
                    };

                    const order = {
                        channelInfo: {
                            type: "WEB",
                        },
                        currency,
                        recipientInfo,
                        buyerInfo: recipientInfo.contactDetails,
                        lineItems,
                        priceSummary: {
                            subtotal: { amount: sumTotal.toFixed(2), currency },
                            shipping: { amount: shippingCost.toFixed(2), currency },
                            tax: { amount: "0.00", currency },
                            discount: { amount: "0.00", currency },
                            totalAdditionalFees: { amount: "0.00", currency },
                            total: { amount: grandTotal.toFixed(2), currency }
                        },
                        options: {}
                    };

                    console.log("🚀 Final Order Payload:", order);

                    const payment = await createMyPayment({
                        items: paymentItems,
                        totalPrice: grandTotal
                    });

                    const options = { includeChannelInfo: true };
                    const createdOrder = await createMyOrder(order, options);
                    console.log("order created",createdOrder);

                    const paymentResult = await wixPay.startPayment(payment.id);

                    if (paymentResult.status === "Successful") {
                        await updateMyOrderPaymentStatus({
                            orderId: createdOrder._id,
                            paymentId: payment.id,
                            status: "APPROVED"
                        });
                        console.log("✅ Payment and Order completed successfully.");
                    } else {
                        console.warn("⚠️ Payment cancelled or failed:", paymentResult.status);
                    }

                } catch (error) {
                    console.error("❌ Payment/Order process failed:", error);
                    await logErrorToDB("paymentButton.onClick", error);
                }
            });

        })
        .catch(err => {
            console.error('Could not load cart:', err);
            logErrorToDB('loadCartAndBind', err);

        });
}

function normalizeName(name) {
    return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

async function logErrorToDB(location, error) {
    try {
        await wixData.insert("ErrorLogs", {
            location,
            message: error.message || String(error),
            stack: error.stack || null,
            timestamp: new Date()
        });
    } catch (loggingError) {
        console.error("Failed to log error to DB:", loggingError);
    }
}