# Step 1: Build stage using Maven and OpenJDK 21
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy the pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build the JAR file, skipping tests for faster deployment
RUN mvn clean package -DskipTests

# Step 2: Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the generated JAR file from the build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080 (standard Spring Boot port)
EXPOSE 8080

# Run the app
ENTRYPOINT ["java", "-jar", "app.jar"]