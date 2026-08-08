# Use a lightweight Node.js image
FROM node:alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose the port your app runs on (e.g., 3000)
EXPOSE 3000

# Command to start your app
CMD ["npm", "start"]