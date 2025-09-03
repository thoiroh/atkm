<?php

namespace Atkb\Core;

/**
 * Router class for handling HTTP requests
 * Manages route registration and request dispatching
 */
class Router
{
    private array $routes = [];
    private array $middleware = [];

    /**
     * Register GET route
     */
    public function get(string $path, array $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }

    /**
     * Register POST route
     */
    public function post(string $path, array $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }

    /**
     * Register PUT route
     */
    public function put(string $path, array $handler): void
    {
        $this->addRoute('PUT', $path, $handler);
    }

    /**
     * Register DELETE route
     */
    public function delete(string $path, array $handler): void
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    /**
     * Add middleware to router
     */
    public function addMiddleware(object $middleware): void
    {
        $this->middleware[] = $middleware;
    }

    /**
     * Handle incoming request
     */
    public function handle(Request $request): Response
    {
        // Execute middleware
        foreach ($this->middleware as $middleware) {
            $result = $middleware->handle($request);
            if ($result instanceof Response) {
                return $result;
            }
        }

        // Find matching route
        $method = $request->getMethod();
        $path = $request->getPath();

        foreach ($this->routes as $route) {
            if ($route['method'] === $method && $this->matchPath($route['path'], $path)) {
                return $this->executeRoute($route, $request);
            }
        }

        // Route not found
        return new Response([
            'success' => false,
            'error' => [
                'code' => 404,
                'message' => 'Route not found',
                'path' => $path,
                'method' => $method
            ]
        ], 404);
    }

    /**
     * Add route to routes array
     */
    private function addRoute(string $method, string $path, array $handler): void
    {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler
        ];
    }

    /**
     * Check if route path matches request path
     */
    private function matchPath(string $routePath, string $requestPath): bool
    {
        // Remove query parameters from request path
        $requestPath = strtok($requestPath, '?');
        
        // Exact match
        if ($routePath === $requestPath) {
            return true;
        }

        // Pattern matching for dynamic routes (future implementation)
        return false;
    }

    /**
     * Execute route handler
     */
    private function executeRoute(array $route, Request $request): Response
    {
        $handler = $route['handler'];
        $controllerClass = $handler[0];
        $methodName = $handler[1];

        if (!class_exists($controllerClass)) {
            throw new \Exception("Controller class not found: {$controllerClass}");
        }

        $controller = new $controllerClass();

        if (!method_exists($controller, $methodName)) {
            throw new \Exception("Method not found: {$controllerClass}::{$methodName}");
        }

        return $controller->$methodName($request);
    }
}