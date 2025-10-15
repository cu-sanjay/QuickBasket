# Contributing to QuickBasket

Thank you for your interest in contributing to **QuickBasket**.
This project is **beginner-friendly** and part of **Hacktoberfest**, created to help new contributors start their open-source journey.

We encourage you to take open source seriously. Contributions here are not about **“free swags”**, but about **learning, building real-world skills, and enhancing your portfolio** while working on meaningful projects.

## 📌 How to Contribute

### 1. Fork the Repository

Click on the **Fork** button in the top-right corner of this repo to create your own copy.

### 2. Clone Your Fork

Clone your forked repo to your local machine:

```bash
git clone https://github.com/cu-sanjay/QuickBasket-Hacktoberfest.git
```

### 3. Set Up Your Local Environment

Before you start making changes, make sure you set up your local Firebase configuration. See the instructions in the `README.md` file under the "Setting Up the Project Locally" section.

### 4. Create a New Branch

Always create a new branch before making changes:

```bash
git checkout -b feature-branch
```

### 5. Make Your Changes

* Add new features
* Fix bugs
* Improve design (HTML, CSS)
* Enhance JavaScript functionality

### 6. Commit Your Changes

Use a clear and descriptive commit message:

```bash
git commit -m "Added coupon validation feature"
```

### 7. Push to Your Fork

```bash
git push origin feature-branch
```

### 8. Open a Pull Request (PR)

* Go to the original repo on GitHub
* Click **New Pull Request**
* Select your branch and submit 🎉

## ✅ Contribution Rules

* Keep PRs **small and focused** (one feature or fix per PR).
* Follow proper **HTML, CSS, and JavaScript formatting**.
* Do not remove or break existing functionality.
* Do not submit spam or invalid pull requests.
* No cosmetic changes like unnecessary spaces, punctuation edits, or unneeded rewrites.
* Only make changes that bring **real improvements or fixes**.
* Be respectful and supportive of fellow contributors.

## 💡 Good First Issues

Check out the **[Issues](../../issues)** tab for tasks labeled:

* `good first issue`
* `hacktoberfest`
* `hacktoberfest-2025`

These are beginner-friendly and perfect to start with.

## 🔑 Coding Style Guide

* Use **semantic HTML** (`<header>`, `<footer>`, `<section>`).
* Use **CSS classes** instead of inline styles.
* Keep JavaScript functions **modular** (avoid repetition).
* Write **clear comments** for any complex logic.

Example:

```js
// ✅ Good Example
function calculateTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

## 🎯 Hacktoberfest Note

Hacktoberfest is about **learning and contributing meaningfully**. Please:

* Submit only **valid pull requests** with actual improvements.
* Treat this project as a chance to **learn open source practices**.
* Use this as an opportunity to **collaborate, learn, and grow** as a developer.

By contributing, you not only help improve QuickBasket but also **gain experience, enhance your portfolio, and become part of the open-source community**.

> Happy Coding 💻 and welcome to the **QuickBasket Community** 🚀
