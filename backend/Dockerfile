# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
# Descargar dependencias (permite cachear esta capa de Docker)
RUN mvn dependency:go-offline -B
COPY src ./src
# Compilar saltando pruebas
RUN mvn package -DskipTests

# Stage 2: Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/nextlead-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
