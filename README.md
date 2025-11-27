# Live Metro Transit Tracker

This web app is made to easily track Metro Transit trains and buses while using public transit. It displays live vehicle locations and arrival times for most routes in the Twin Cities Area. The data is fetched from the NextTrip API. This app is under development and I will likely add new features in the future.

LINK: [benatfroemming.github.io/metrotransit](https://benatfroemming.github.io/metrotransit/)

<img width="1914" height="910" alt="image" src="https://github.com/user-attachments/assets/f060e8d0-bdeb-4d43-a1e7-93b3a8e56340" />


# 🤖 Machine Learning Code Documentation

This file demonstrates how to use **Explicode markdown blocks** to explain ML code.

We will define a simple linear regression example using `scikit-learn`.

---

## 📦 Imports

- `numpy` for numerical operations
- `matplotlib` for plotting
- `sklearn.linear_model` for Linear Regression

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
```

## 🧮 Generate Data

We create a simple dataset:

- `X` is a 2D array of features
- `y` is the target, generated with some linear relationship and noise

Notice how we reshape `X` to be a 2D array, which is required by scikit-learn.

```python
# Generate synthetic data
np.random.seed(0)
X = 2 * np.random.rand(100, 1)
y = 4 + 3 * X + np.random.randn(100, 1)
```

## 🏗️ Model Training

We instantiate a Linear Regression model and fit it:

- `model.fit(X, y)` learns the coefficients
- `model.coef_` and `model.intercept_` store the learned parameters

```python
# Train the model
model = LinearRegression()
model.fit(X, y)
```

## 📊 Predictions & Plotting

We predict using the trained model and visualize the results.

- Blue dots: actual data points
- Red line: predicted regression line

Math representation of prediction:

```math
\hat{y} = \theta_0 + \theta_1 X
```
where $\theta_0$ is the intercept and $\theta_1$ is the slope.

```python
# Predict
X_new = np.array([[0], [2]])
y_pred = model.predict(X_new)

# Plot
plt.scatter(X, y, color='blue', label='Data')
plt.plot(X_new, y_pred, color='red', linewidth=2, label='Prediction')
plt.xlabel('X')
plt.ylabel('y')
plt.title('Linear Regression Example')
plt.legend()
plt.show()
```

## ✅ Summary

- We imported libraries
- Generated synthetic linear data
- Trained a Linear Regression model
- Visualized predictions

This is a basic template for **annotating Python ML code using multiple markdown blocks**.

