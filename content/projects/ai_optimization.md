---
# Copy this file to a new name (for example staffing-forecast.md) and edit.
# Delete `draft: true` to make it appear on the portfolio page.
# This file stays hidden as long as draft is true.

title: AI Optimization
description: Using AI to predict the health risk score, then making it better.
stack:
  - python
  - sci-kit learn
link: https://github.com/wsehsatnoen/ai_optimizaiton
featured: false   # true renders a wide, olive card
span: 4           # optional: 4, 5, 6, 7 or 8. Ignored when featured is true.
order: 2          # lower numbers sort first
draft: false
---

# AI Optimization for Health Risk Assessment

Four tasks built on the same dataset and the same linear regression model. Task One selects and validates the algorithm, Task Two optimizes it, Task Three interprets what the optimized model learned, and Task Four applies it to a new use case. For more detail, visit my github and view the markdown files!

## Task One: Research and Select an AI Algorithm

The task is to research three AI algorithms capable of solving the optimization problem, predicting a health risk score from measurable weather features, and to select one to train and test on the DQN1 dataset. The three researched are Linear Regression, Gaussian Process Regression, and Decision Tree Regression.

Linear regression is selected. The algorithm assigns weights to each feature, which mirrors the way air quality metrics and thermal indicators compound with one another, and it carries two strengths that suit the problem: minimal computational cost to train, test, and scale, and a low variance that makes it more resistant to overfitting than a decision tree. The drawbacks are stated before any training is done. A forced straight-line relationship cannot represent the exponential thresholds, or tipping points, that occur in nature, and the algorithm is sensitive to multicollinearity, as heat index, temperature max, and feels like are all correlated through the same underlying temperature.

The model is measured on R2 score and Mean Squared Error, producing an R2 of 0.9677 and a Mean Squared Error of 0.0146 on the DQN1 dataset. The plots show noticeable outliers the model could not predict, which is consistent with the tipping point limitation identified beforehand.

## Task Two: Optimization, Regularization, and Ensemble Methods

The base linear regression model reaches an R2 score of .9677 and a Mean Squared Error of .0147. Because linear regression is a model well researched and optimized, improvement is a matter of fine tuning rather than redesign. Three categories of approach are applied and compared against that control: hyperparameter tuning through RandomizedSearchCV and HalvingRandomSearchCV, regularization through Lasso and Ridge, and ensemble learning through Bagging and AdaBoost. Each is measured on the same two metrics, R2 score and Mean Squared Error.

Ridge regression performs the best of the seven, at an R2 score of .9688 and a Mean Squared Error of .0141. Lasso performs the worst by a wide margin. The two ensemble techniques score below the base model, which is the expected outcome, as ensemble methods are intended to combine weak learners and linear regression is already a strong stable one.

## Task Three: Feature Significance and Model Interpretation

With the model optimized to ridge regression, the next step is to evaluate the significance of each feature and its contribution to the health risk score. Shapley values provide that information.

The heat index is the most important feature by a wide margin, with a mean Shapley value of 0.46, nearly double the next feature. The bee swarm graph shows the effect is not evenly distributed; as the heat index rises, its impact on the prediction increases sharply. At the other end, four features are effectively insignificant: month, no2, precipcover, and pm2.5. The results confirm that heat and humidity drive the health risk score, and they also confirm the limitation raised in Task One, as a linear regression fits a straight line and cannot represent the sudden impact the heat index has at higher values.

## Task Four: New Use Case for the Optimized Model

A new use case for the optimized model is predicting the number of Cycle Count tasks that will be generated for warehouse associates. For context, system generated inventory tasks populate at 4:30 pm each day, and the count is not known until the script runs. Knowing that number beforehand is necessary for operational planning.

Because inventory does not depend on a single day of activity, the features are engineered through autoregression, using a lag of the four previous operational days to match the average shelf life of outbound product. Ridge regression suits this design, as the lagged features introduce multicollinearity and ridge is built to manage it by penalizing large coefficients. The model is measured on the same two metrics as the previous tasks, comparing its daily predictions against the tasks actually generated at 4:30 pm.
