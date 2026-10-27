const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const toast = (message) => {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    element.classList.remove("show");
  }, 2600);
};

// Investment portfolio chart: fictional data for demonstration only.
const periods = {
  7: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [2280000, 2310000, 2290000, 2370000, 2340000, 2410000, 2450000]
  },
  30: {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    values: [2190000, 2250000, 2360000, 2450000]
  },
  90: {
    labels: ["Month 1", "Month 2", "Month 3"],
    values: [2070000, 2280000, 2450000]
  },
  365: {
    labels: ["Q1", "Q2", "Q3", "Q4"],
    values: [1850000, 2040000, 2260000, 2450000]
  }
};

let portfolioChart;

function renderChart(period = 7) {
  const canvas = $("#portfolioChart");
  if (!canvas || typeof Chart === "undefined") {
    toast("Chart library unavailable. Check your internet connection.");
    return;
  }

  const selected = periods[period];

  if (portfolioChart) portfolioChart.destroy();

  portfolioChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: selected.labels,
      datasets: [{
        data: selected.values,
        borderColor: "#d6f36a",
        backgroundColor: "rgba(214,243,106,0.08)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "#d6f36a"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) =>
              " ₦" + context.parsed.y.toLocaleString("en-NG")
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#9da59f", maxTicksLimit: 7 }
        },
        y: {
          display: false,
          grid: { color: "#ffffff0b" }
        }
      }
    }
  });
}

renderChart();

$$(".period").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".period").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderChart(Number(button.dataset.period));
  });
});

// Demo dialog. This does not authenticate users or send their information.
const dialog = $("#infoDialog");

$("#loginBtn").addEventListener("click", () => {
  $("#dialogTitle").textContent = "Welcome to SLATE";
  $("#dialogText").textContent =
    "Try the interface using fictional demo data. No real account is created.";
  dialog.showModal();
});

$("#closeDialog").addEventListener("click", () => dialog.close());

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

$("#demoForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const email = $("#demoEmail").value.trim();
  const password = $("#demoPassword").value;

  if (!email || password.length < 4) {
    toast("Enter a valid email and a demo password of 4+ characters.");
    return;
  }

  // Deliberately do not store, transmit, or authenticate credentials.
  $("#demoPassword").value = "";
  dialog.close();
  $("#dashboard").scrollIntoView({ behavior: "smooth" });
  toast("Demo mode opened. All portfolio data is fictional.");
});

// Investment cards explain the selected asset class.
const assetInfo = {
  Stocks:
    "Stocks represent ownership in a company. Prices fluctuate, and you can lose money.",
  Bonds:
    "Bonds are debt instruments. They have risks including default, interest-rate changes, and inflation.",
  Funds:
    "Funds pool investments into a portfolio. Fees, holdings, and market risks vary."
};

$$("[data-asset]").forEach((button) => {
  button.addEventListener("click", () => {
    const asset = button.dataset.asset;
    $("#dialogTitle").textContent = asset;
    $("#dialogText").textContent = assetInfo[asset];
    $("#demoForm").hidden = true;
    dialog.showModal();
  });
});

dialog.addEventListener("close", () => {
  $("#demoForm").hidden = false;
});

const button = document.getElementById("payButton");
const message = document.getElementById("paymentMessage");

if (button && message) {
  button.addEventListener("click", async () => {
    button.disabled = true;
    message.textContent = "Preparing secure checkout...";

    try {
      const response = await fetch(
        "/api/create-checkout-session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        }
      );

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Checkout unavailable");
      }

      window.location.assign(data.url);
    } catch (error) {
      message.textContent =
        error.message || "Something went wrong. Please try again.";
      button.disabled = false;
    }
  });
}

require("dotenv").config();

const express = require("express");
const Stripe = require("stripe");
const path = require("path");

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());
app.use(express.static(__dirname));

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "SLATE Test Product",
            },
            unit_amount: 1000,
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/success.html",
      cancel_url: "http://localhost:3000/cancel.html",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error.message);
    res.status(500).json({
      error: "Unable to create checkout session",
    });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`SLATE server running at http://localhost:${PORT}`);
});