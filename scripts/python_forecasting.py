import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import sqlite3
import json
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.holtwinters import ExponentialSmoothing

# Connect to the SQLite database
conn = sqlite3.connect('prisma/dev.db')

# Function to load data from the database
def load_data():
    # Get stock movements data
    stock_movements = pd.read_sql("""
        SELECT
            sm.id, sm.itemId, sm.type, sm.quantity, sm.createdAt,
            i.name as item_name, i.reference, i.unit, i.categoryId
        FROM stock_movements sm
        JOIN items i ON sm.itemId = i.id
        WHERE sm.type = 'OUT'
        ORDER BY sm.createdAt
    """, conn)
    
    # Convert createdAt to datetime
    stock_movements['createdAt'] = pd.to_datetime(stock_movements['createdAt'])
    
    # Get items data
    items = pd.read_sql("""
        SELECT
            i.id, i.name, i.reference, i.unit, i.price, i.minStock, i.currentStock,
            c.name as category_name
        FROM items i
        JOIN categories c ON i.categoryId = c.id
    """, conn)
    
    # Get existing forecasts
    forecasts = pd.read_sql("""
        SELECT
            df.id, df.itemId, df.period, df.periodType, df.predictedDemand,
            df.actualDemand, df.confidence, df.algorithm, df.factors, df.createdAt,
            i.name as item_name
        FROM demand_forecasts df
        JOIN items i ON df.itemId = i.id
    """, conn)
    
    return stock_movements, items, forecasts

# Function to prepare time series data for a specific item
def prepare_time_series(stock_movements, item_id, period_type='MONTHLY'):
    # Filter data for the specific item
    item_data = stock_movements[stock_movements['itemId'] == item_id].copy()
    
    if item_data.empty:
        return None
    
    # Group by period
    if period_type == 'WEEKLY':
        item_data['period'] = item_data['createdAt'].dt.to_period('W').astype(str)
    elif period_type == 'MONTHLY':
        item_data['period'] = item_data['createdAt'].dt.to_period('M').astype(str)
    elif period_type == 'QUARTERLY':
        item_data['period'] = item_data['createdAt'].dt.to_period('Q').astype(str)
    elif period_type == 'YEARLY':
        item_data['period'] = item_data['createdAt'].dt.to_period('Y').astype(str)
    
    # Aggregate by period
    time_series = item_data.groupby('period')['quantity'].sum().reset_index()
    time_series['period'] = pd.to_datetime(time_series['period'])
    time_series = time_series.sort_values('period')
    
    return time_series

# Function to visualize time series data
def visualize_time_series(time_series, item_name, period_type):
    plt.figure(figsize=(12, 6))
    plt.plot(time_series['period'], time_series['quantity'], marker='o')
    plt.title(f'Demand Time Series for {item_name} ({period_type})')
    plt.xlabel('Period')
    plt.ylabel('Quantity')
    plt.grid(True)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(f'../public/forecasts/{item_name.replace(" ", "_")}_{period_type}_time_series.png')
    plt.close()

# Function to perform seasonal decomposition
def perform_seasonal_decomposition(time_series, item_name, period_type):
    if len(time_series) < 4:
        return None
    
    # Set the frequency based on period type
    if period_type == 'WEEKLY':
        freq = 52  # 52 weeks in a year
    elif period_type == 'MONTHLY':
        freq = 12  # 12 months in a year
    elif period_type == 'QUARTERLY':
        freq = 4   # 4 quarters in a year
    else:
        return None  # Not enough data for yearly decomposition
    
    # Check if we have enough periods for decomposition
    if len(time_series) < 2 * freq:
        # Use a smaller frequency if we don't have enough data
        freq = max(2, len(time_series) // 2)
    
    try:
        # Perform seasonal decomposition
        decomposition = seasonal_decompose(
            time_series.set_index('period')['quantity'], 
            model='additive', 
            period=freq
        )
        
        # Plot the decomposition
        fig, (ax1, ax2, ax3, ax4) = plt.subplots(4, 1, figsize=(12, 10))
        decomposition.observed.plot(ax=ax1)
        ax1.set_title('Observed')
        decomposition.trend.plot(ax=ax2)
        ax2.set_title('Trend')
        decomposition.seasonal.plot(ax=ax3)
        ax3.set_title('Seasonality')
        decomposition.resid.plot(ax=ax4)
        ax4.set_title('Residuals')
        plt.tight_layout()
        plt.savefig(f'../public/forecasts/{item_name.replace(" ", "_")}_{period_type}_decomposition.png')
        plt.close()
        
        return decomposition
    except Exception as e:
        print(f"Error in seasonal decomposition for {item_name}: {e}")
        return None

# Function to forecast using ARIMA
def forecast_arima(time_series, periods=3):
    if len(time_series) < 4:
        return None, None
    
    try:
        # Fit ARIMA model
        model = ARIMA(time_series.set_index('period')['quantity'], order=(1, 1, 1))
        model_fit = model.fit()
        
        # Forecast
        forecast = model_fit.forecast(steps=periods)
        forecast_values = forecast.values
        
        # Calculate confidence
        confidence = 0.7  # Base confidence
        if len(time_series) >= 12:
            confidence = 0.85
        elif len(time_series) >= 6:
            confidence = 0.75
        
        return forecast_values, confidence
    except Exception as e:
        print(f"Error in ARIMA forecasting: {e}")
        return None, None

# Function to forecast using Holt-Winters Exponential Smoothing
def forecast_holt_winters(time_series, periods=3, seasonal_periods=None):
    if len(time_series) < 4 or seasonal_periods is None:
        return None, None
    
    try:
        # Fit Holt-Winters model
        model = ExponentialSmoothing(
            time_series.set_index('period')['quantity'],
            seasonal='add',
            seasonal_periods=seasonal_periods
        )
        model_fit = model.fit()
        
        # Forecast
        forecast = model_fit.forecast(periods)
        forecast_values = forecast.values
        
        # Calculate confidence
        confidence = 0.75  # Base confidence
        if len(time_series) >= 2 * seasonal_periods:
            confidence = 0.9
        elif len(time_series) >= seasonal_periods:
            confidence = 0.8
        
        return forecast_values, confidence
    except Exception as e:
        print(f"Error in Holt-Winters forecasting: {e}")
        return None, None

# Function to forecast using Random Forest
def forecast_random_forest(time_series, periods=3):
    if len(time_series) < 4:
        return None, None
    
    try:
        # Create features (lag values)
        data = time_series.copy()
        for i in range(1, min(4, len(time_series))):
            data[f'lag_{i}'] = data['quantity'].shift(i)
        
        # Drop rows with NaN values
        data = data.dropna()
        
        if len(data) < 3:
            return None, None
        
        # Prepare training data
        X = data.drop(['period', 'quantity'], axis=1)
        y = data['quantity']
        
        # Train Random Forest model
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        # Prepare forecast data
        forecast_values = []
        last_values = time_series['quantity'].tail(min(4, len(time_series))).values
        
        for _ in range(periods):
            features = np.array([last_values[-min(3, len(last_values)):]])
            # Pad with zeros if we don't have enough lag values
            if features.shape[1] < 3:
                features = np.pad(features, ((0, 0), (0, 3 - features.shape[1])), 'constant')
            
            # Make prediction
            prediction = model.predict(features)[0]
            forecast_values.append(prediction)
            
            # Update last values for next prediction
            last_values = np.append(last_values[1:], prediction)
        
        # Calculate confidence
        confidence = 0.7  # Base confidence
        if len(time_series) >= 12:
            confidence = 0.8
        elif len(time_series) >= 6:
            confidence = 0.75
        
        return forecast_values, confidence
    except Exception as e:
        print(f"Error in Random Forest forecasting: {e}")
        return None, None

# Function to generate next period based on the last period in the time series
def generate_next_periods(last_period, period_type, num_periods=3):
    last_date = pd.to_datetime(last_period)
    next_periods = []
    
    for i in range(1, num_periods + 1):
        if period_type == 'WEEKLY':
            next_date = last_date + timedelta(days=7 * i)
            next_period = next_date.strftime('%Y-%m-%d')
        elif period_type == 'MONTHLY':
            next_date = last_date + pd.DateOffset(months=i)
            next_period = next_date.strftime('%Y-%m')
        elif period_type == 'QUARTERLY':
            next_date = last_date + pd.DateOffset(months=3 * i)
            quarter = (next_date.month - 1) // 3 + 1
            next_period = f"{next_date.year}-Q{quarter}"
        elif period_type == 'YEARLY':
            next_date = last_date + pd.DateOffset(years=i)
            next_period = str(next_date.year)
        
        # next_period is always assigned in the if/elif blocks above
        next_periods.append(next_period)
    
    return next_periods

# Function to save forecasts to the database
def save_forecast(item_id, period, period_type, predicted_demand, confidence, algorithm, factors):
    cursor = conn.cursor()
    
    # Check if forecast already exists
    cursor.execute("""
        SELECT id FROM demand_forecasts 
        WHERE itemId = ? AND period = ? AND periodType = ?
    """, (item_id, period, period_type))
    
    existing_forecast = cursor.fetchone()
    
    if existing_forecast:
        # Update existing forecast
        cursor.execute("""
            UPDATE demand_forecasts 
            SET predictedDemand = ?, confidence = ?, algorithm = ?, factors = ?, updatedAt = CURRENT_TIMESTAMP 
            WHERE id = ?
        """, (predicted_demand, confidence, algorithm, factors, existing_forecast[0]))
    else:
        # Create new forecast
        cursor.execute("""
            INSERT INTO demand_forecasts 
            (id, itemId, period, periodType, predictedDemand, confidence, algorithm, factors, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (f"clfcst{datetime.now().strftime('%Y%m%d%H%M%S')}{np.random.randint(1000, 9999)}", item_id, period, period_type, predicted_demand, confidence, algorithm, factors))
    
    conn.commit()

# Main function to run the forecasting
def main():
    # Create forecasts directory if it doesn't exist
    import os
    os.makedirs('../public/forecasts', exist_ok=True)
    
    # Load data
    stock_movements, items, forecasts = load_data()
    
    # Process each item
    for _, item in items.iterrows():
        item_id = item['id']
        item_name = item['name']
        
        print(f"Processing forecasts for {item_name}...")
        
        # Process different period types
        for period_type in ['MONTHLY', 'QUARTERLY']:
            # Prepare time series data
            time_series = prepare_time_series(stock_movements, item_id, period_type)
            
            if time_series is None or len(time_series) < 3:
                print(f"Not enough data for {item_name} with period type {period_type}")
                continue
            
            # Visualize time series
            visualize_time_series(time_series, item_name, period_type)
            
            # Perform seasonal decomposition
            decomposition = perform_seasonal_decomposition(time_series, item_name, period_type)
            
            # Set seasonal periods based on period type
            if period_type == 'MONTHLY':
                seasonal_periods = 12
            elif period_type == 'QUARTERLY':
                seasonal_periods = 4
            else:
                seasonal_periods = None
            
            # Generate forecasts using different methods
            forecast_methods = {
                'ARIMA': forecast_arima(time_series, periods=3),
                'HOLT_WINTERS': forecast_holt_winters(time_series, periods=3, seasonal_periods=seasonal_periods) if seasonal_periods else (None, None),
                'RANDOM_FOREST': forecast_random_forest(time_series, periods=3)
            }
            
            # Generate next periods
            next_periods = generate_next_periods(time_series['period'].iloc[-1], period_type, num_periods=3)
            
            # Save forecasts to database
            for method_name, (forecast_values, confidence) in forecast_methods.items():
                if forecast_values is not None and len(forecast_values) > 0:
                    for i, (period, value) in enumerate(zip(next_periods, forecast_values)):
                        # Ensure positive values and round to integers
                        predicted_demand = max(0, int(round(value)))
                        
                        # Prepare factors JSON
                        factors = {
                            'historicalPeriods': len(time_series),
                            'averageDemand': float(time_series['quantity'].mean()),
                            'stdDev': float(time_series['quantity'].std()),
                            'lastValue': float(time_series['quantity'].iloc[-1]),
                            'forecastHorizon': i + 1
                        }
                        
                        if decomposition is not None:
                            factors['seasonalityDetected'] = True
                            factors['trendDirection'] = 'up' if decomposition.trend.diff().mean() > 0 else 'down'
                        
                        # Save to database
                        save_forecast(
                            item_id, 
                            period, 
                            period_type, 
                            predicted_demand, 
                            confidence, 
                            method_name, 
                            json.dumps(factors)
                        )
                        
                        print(f"Saved {method_name} forecast for {item_name}, period {period}: {predicted_demand}")
    
    # Close database connection
    conn.close()
    
    print("Forecasting completed successfully!")

if __name__ == "__main__":
    main()