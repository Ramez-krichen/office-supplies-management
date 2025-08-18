# Load required libraries
if (!require("pacman")) install.packages("pacman")
pacman::p_load(
  idyverse,    # Data manipulation and visualizatio
  forecast,     # Time series forecasting
  tseries,      # Time series analysis
  lubridate,    # Date manipulation
  RSQLite,      # SQLite connection
  jsonlite,     # JSON handling
  DBI,          # Database interface
  ggplot2,      # Advanced plotting
  scales,       # Scale functions for visualization
  zoo           # Time series objects
)

# Connect to the SQLite database
conn <- dbConnect(RSQLite::SQLite(), "prisma/dev.db")

# Function to load data from the database
load_data <- function() {
  # Get stock movements data
  stock_movements <- dbGetQuery(conn, "
    SELECT 
      sm.id, sm.itemId, sm.type, sm.quantity, sm.createdAt,
      i.name as item_name, i.reference, i.unit, i.categoryId
    FROM stock_movements sm
    JOIN items i ON sm.itemId = i.id
    WHERE sm.type = 'OUT'
    ORDER BY sm.createdAt
  ")
  
  # Convert createdAt to Date
  stock_movements$createdAt <- as.POSIXct(stock_movements$createdAt)
  
  # Get items data
  items <- dbGetQuery(conn, "
    SELECT 
      i.id, i.name, i.reference, i.unit, i.price, i.minStock, i.currentStock,
      c.name as category_name
    FROM items i
    JOIN categories c ON i.categoryId = c.id
  ")
  
  # Get existing forecasts
  forecasts <- dbGetQuery(conn, "
    SELECT 
      df.id, df.itemId, df.period, df.periodType, df.predictedDemand, 
      df.actualDemand, df.confidence, df.algorithm, df.factors, df.createdAt,
      i.name as item_name
    FROM demand_forecasts df
    JOIN items i ON df.itemId = i.id
  ")
  
  return(list(stock_movements = stock_movements, items = items, forecasts = forecasts))
}

# Function to prepare time series data for a specific item
prepare_time_series <- function(stock_movements, item_id, period_type = 'MONTHLY') {
  # Filter data for the specific item
  item_data <- stock_movements[stock_movements$itemId == item_id, ]
  
  if (nrow(item_data) == 0) {
    return(NULL)
  }
  
  # Group by period
  if (period_type == 'WEEKLY') {
    item_data$period <- format(item_data$createdAt, "%Y-%U")
  } else if (period_type == 'MONTHLY') {
    item_data$period <- format(item_data$createdAt, "%Y-%m")
  } else if (period_type == 'QUARTERLY') {
    item_data$period <- paste0(
      format(item_data$createdAt, "%Y"), 
      "-Q", 
      quarter(item_data$createdAt)
    )
  } else if (period_type == 'YEARLY') {
    item_data$period <- format(item_data$createdAt, "%Y")
  }
  
  # Aggregate by period
  time_series <- item_data %>%
    group_by(period) %>%
    summarize(quantity = sum(quantity)) %>%
    arrange(period)
  
  return(time_series)
}

# Function to visualize time series data
visualize_time_series <- function(time_series, item_name, period_type) {
  # Create directory if it doesn't exist
  dir.create("../public/forecasts", showWarnings = FALSE, recursive = TRUE)
  
  # Create plot
  p <- ggplot(time_series, aes(x = period, y = quantity, group = 1)) +
    geom_line() +
    geom_point() +
    labs(
      title = paste("Demand Time Series for", item_name, "(", period_type, ")"),
      x = "Period",
      y = "Quantity"
    ) +
    theme_minimal() +
    theme(axis.text.x = element_text(angle = 45, hjust = 1))
  
  # Save plot
  file_name <- paste0(
    "../public/forecasts/", 
    gsub(" ", "_", item_name), 
    "_", 
    period_type, 
    "_time_series_R.png"
  )
  ggsave(file_name, p, width = 10, height = 6)
  
  return(p)
}

# Function to convert time series to ts object
convert_to_ts <- function(time_series, period_type) {
  # Determine frequency based on period type
  if (period_type == 'WEEKLY') {
    frequency <- 52
  } else if (period_type == 'MONTHLY') {
    frequency <- 12
  } else if (period_type == 'QUARTERLY') {
    frequency <- 4
  } else if (period_type == 'YEARLY') {
    frequency <- 1
  } else {
    frequency <- 1
  }
  
  # Extract start year and period
  if (nrow(time_series) > 0) {
    if (period_type == 'WEEKLY') {
      parts <- strsplit(time_series$period[1], "-")[[1]]
      start_year <- as.numeric(parts[1])
      start_period <- as.numeric(parts[2])
    } else if (period_type == 'MONTHLY') {
      parts <- strsplit(time_series$period[1], "-")[[1]]
      start_year <- as.numeric(parts[1])
      start_period <- as.numeric(parts[2])
    } else if (period_type == 'QUARTERLY') {
      parts <- strsplit(time_series$period[1], "-Q")[[1]]
      start_year <- as.numeric(parts[1])
      start_period <- as.numeric(parts[2])
    } else {
      start_year <- as.numeric(time_series$period[1])
      start_period <- 1
    }
    
    # Create ts object
    ts_data <- ts(
      time_series$quantity, 
      start = c(start_year, start_period), 
      frequency = frequency
    )
    
    return(ts_data)
  } else {
    return(NULL)
  }
}

# Function to perform STL decomposition
perform_stl_decomposition <- function(ts_data, item_name, period_type) {
  if (is.null(ts_data) || length(ts_data) < 8) {
    return(NULL)
  }
  
  # Determine s.window based on frequency
  s_window <- frequency(ts_data)
  if (s_window < 4) s_window <- "periodic"
  
  tryCatch({
    # Perform STL decomposition
    stl_result <- stl(ts_data, s.window = s_window, robust = TRUE)
    
    # Plot decomposition
    png(
      paste0(
        "../public/forecasts/", 
        gsub(" ", "_", item_name), 
        "_", 
        period_type, 
        "_decomposition_R.png"
      ),
      width = 800, height = 600
    )
    plot(stl_result)
    dev.off()
    
    return(stl_result)
  }, error = function(e) {
    cat("Error in STL decomposition for", item_name, ":", e$message, "\n")
    return(NULL)
  })
}

# Function to forecast using ETS (Error, Trend, Seasonal) model
forecast_ets <- function(ts_data, periods = 3) {
  if (is.null(ts_data) || length(ts_data) < 4) {
    return(list(forecast = NULL, confidence = NULL))
  }
  
  tryCatch({
    # Fit ETS model
    model <- ets(ts_data)
    
    # Forecast
    forecast_result <- forecast(model, h = periods)
    forecast_values <- as.numeric(forecast_result$mean)
    
    # Calculate confidence
    confidence <- 0.7  # Base confidence
    if (length(ts_data) >= 12) {
      confidence <- 0.85
    } else if (length(ts_data) >= 6) {
      confidence <- 0.75
    }
    
    return(list(forecast = forecast_values, confidence = confidence))
  }, error = function(e) {
    cat("Error in ETS forecasting:", e$message, "\n")
    return(list(forecast = NULL, confidence = NULL))
  })
}

# Function to forecast using ARIMA
forecast_arima <- function(ts_data, periods = 3) {
  if (is.null(ts_data) || length(ts_data) < 4) {
    return(list(forecast = NULL, confidence = NULL))
  }
  
  tryCatch({
    # Fit auto.arima model
    model <- auto.arima(ts_data)
    
    # Forecast
    forecast_result <- forecast(model, h = periods)
    forecast_values <- as.numeric(forecast_result$mean)
    
    # Calculate confidence
    confidence <- 0.7  # Base confidence
    if (length(ts_data) >= 12) {
      confidence <- 0.85
    } else if (length(ts_data) >= 6) {
      confidence <- 0.75
    }
    
    return(list(forecast = forecast_values, confidence = confidence))
  }, error = function(e) {
    cat("Error in ARIMA forecasting:", e$message, "\n")
    return(list(forecast = NULL, confidence = NULL))
  })
}

# Function to forecast using TBATS (Trigonometric seasonality, Box-Cox transformation, ARMA errors, Trend, and Seasonal components)
forecast_tbats <- function(ts_data, periods = 3) {
  if (is.null(ts_data) || length(ts_data) < 4) {
    return(list(forecast = NULL, confidence = NULL))
  }
  
  tryCatch({
    # Fit TBATS model
    model <- tbats(ts_data)
    
    # Forecast
    forecast_result <- forecast(model, h = periods)
    forecast_values <- as.numeric(forecast_result$mean)
    
    # Calculate confidence
    confidence <- 0.75  # Base confidence
    if (length(ts_data) >= 12) {
      confidence <- 0.9
    } else if (length(ts_data) >= 6) {
      confidence <- 0.8
    }
    
    return(list(forecast = forecast_values, confidence = confidence))
  }, error = function(e) {
    cat("Error in TBATS forecasting:", e$message, "\n")
    return(list(forecast = NULL, confidence = NULL))
  })
}

# Function to generate next period based on the last period in the time series
generate_next_periods <- function(last_period, period_type, num_periods = 3) {
  next_periods <- character(num_periods)
  
  if (period_type == 'WEEKLY') {
    parts <- strsplit(last_period, "-")[[1]]
    year <- as.numeric(parts[1])
    week <- as.numeric(parts[2])
    
    for (i in 1:num_periods) {
      week <- week + 1
      if (week > 52) {
        week <- 1
        year <- year + 1
      }
      next_periods[i] <- sprintf("%04d-%02d", year, week)
    }
  } else if (period_type == 'MONTHLY') {
    parts <- strsplit(last_period, "-")[[1]]
    year <- as.numeric(parts[1])
    month <- as.numeric(parts[2])
    
    for (i in 1:num_periods) {
      month <- month + 1
      if (month > 12) {
        month <- 1
        year <- year + 1
      }
      next_periods[i] <- sprintf("%04d-%02d", year, month)
    }
  } else if (period_type == 'QUARTERLY') {
    parts <- strsplit(last_period, "-Q")[[1]]
    year <- as.numeric(parts[1])
    quarter <- as.numeric(parts[2])
    
    for (i in 1:num_periods) {
      quarter <- quarter + 1
      if (quarter > 4) {
        quarter <- 1
        year <- year + 1
      }
      next_periods[i] <- sprintf("%04d-Q%d", year, quarter)
    }
  } else if (period_type == 'YEARLY') {
    year <- as.numeric(last_period)
    
    for (i in 1:num_periods) {
      year <- year + 1
      next_periods[i] <- as.character(year)
    }
  }
  
  return(next_periods)
}

# Function to save forecasts to the database
save_forecast <- function(item_id, period, period_type, predicted_demand, confidence, algorithm, factors) {
  # Check if forecast already exists
  existing_forecast <- dbGetQuery(
    conn,
    "SELECT id FROM demand_forecasts WHERE itemId = ? AND period = ? AND periodType = ?",
    params = list(item_id, period, period_type)
  )
  
  if (nrow(existing_forecast) > 0) {
    # Update existing forecast
    dbExecute(
      conn,
      "UPDATE demand_forecasts SET predictedDemand = ?, confidence = ?, algorithm = ?, factors = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      params = list(predicted_demand, confidence, algorithm, factors, existing_forecast$id[1])
    )
  } else {
    # Create new forecast
    forecast_id <- paste0(
      "rfcst", 
      format(Sys.time(), "%Y%m%d%H%M%S"), 
      sample(1000:9999, 1)
    )
    
    dbExecute(
      conn,
      "INSERT INTO demand_forecasts (id, itemId, period, periodType, predictedDemand, confidence, algorithm, factors, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
      params = list(forecast_id, item_id, period, period_type, predicted_demand, confidence, algorithm, factors)
    )
  }
}

# Main function to run the forecasting
main <- function() {
  # Load data
  data <- load_data()
  stock_movements <- data$stock_movements
  items <- data$items
  forecasts <- data$forecasts
  
  # Process each item
  for (i in 1:nrow(items)) {
    item_id <- items$id[i]
    item_name <- items$name[i]
    
    cat("Processing forecasts for", item_name, "...\n")
    
    # Process different period types
    for (period_type in c('MONTHLY', 'QUARTERLY')) {
      # Prepare time series data
      time_series <- prepare_time_series(stock_movements, item_id, period_type)
      
      if (is.null(time_series) || nrow(time_series) < 3) {
        cat("Not enough data for", item_name, "with period type", period_type, "\n")
        next
      }
      
      # Visualize time series
      visualize_time_series(time_series, item_name, period_type)
      
      # Convert to ts object
      ts_data <- convert_to_ts(time_series, period_type)
      
      if (is.null(ts_data)) {
        cat("Failed to convert time series to ts object for", item_name, "\n")
        next
      }
      
      # Perform STL decomposition
      stl_result <- perform_stl_decomposition(ts_data, item_name, period_type)
      
      # Generate forecasts using different methods
      forecast_methods <- list(
        ETS = forecast_ets(ts_data, periods = 3),
        ARIMA_R = forecast_arima(ts_data, periods = 3),
        TBATS = forecast_tbats(ts_data, periods = 3)
      )
      
      # Generate next periods
      next_periods <- generate_next_periods(time_series$period[nrow(time_series)], period_type, num_periods = 3)
      
      # Save forecasts to database
      for (method_name in names(forecast_methods)) {
        forecast_result <- forecast_methods[[method_name]]
        forecast_values <- forecast_result$forecast
        confidence <- forecast_result$confidence
        
        if (!is.null(forecast_values) && length(forecast_values) > 0) {
          for (j in 1:length(next_periods)) {
            if (j <= length(forecast_values)) {
              # Ensure positive values and round to integers
              predicted_demand <- max(0, round(forecast_values[j]))
              
              # Prepare factors JSON
              factors <- list(
                historicalPeriods = nrow(time_series),
                averageDemand = mean(time_series$quantity),
                stdDev = sd(time_series$quantity),
                lastValue = time_series$quantity[nrow(time_series)],
                forecastHorizon = j
              )
              
              if (!is.null(stl_result)) {
                factors$seasonalityDetected <- TRUE
                trend_direction <- mean(diff(stl_result$time.series[, "trend"]))
                factors$trendDirection <- ifelse(trend_direction > 0, "up", "down")
              }
              
              # Convert factors to JSON
              factors_json <- toJSON(factors, auto_unbox = TRUE)
              
              # Save to database
              save_forecast(
                item_id, 
                next_periods[j], 
                period_type, 
                predicted_demand, 
                confidence, 
                method_name, 
                factors_json
              )
              
              cat(
                "Saved", method_name, "forecast for", item_name, 
                ", period", next_periods[j], ":", predicted_demand, "\n"
              )
            }
          }
        }
      }
    }
  }
  
  # Close database connection
  dbDisconnect(conn)
  
  cat("R forecasting completed successfully!\n")
}

# Run the main function
main()