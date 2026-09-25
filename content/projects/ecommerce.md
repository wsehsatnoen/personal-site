---
# Copy this file to a new name (for example staffing-forecast.md) and edit.
# Delete `draft: true` to make it appear on the portfolio page.
# This file stays hidden as long as draft is true.

title: eCommerce Backend
description: eCommerce backend built for an angular front end.
stack:
  - java
  - spring
  - sql
link: https://github.com/wsehsatnoen/ecommerce
featured: false   # true renders a wide, olive card
span: 4           # optional: 4, 5, 6, 7 or 8. Ignored when featured is true.
order: 1          # lower numbers sort first
draft: false
---

# ecommerceapp

The ecommerceapp is a Spring Boot backend for a vacation shop: customers browse vacation packages,
add optional excursions, and check out. It exposes the data model as a REST (Representational State
Transfer) API over MySQL, plus one hand-written checkout endpoint that turns a cart into a persisted
order.

This is a learning project. I built it to get hands-on experience with JPA (Jakarta Persistence API)
relationship mapping and Spring Data REST, not to run in production. Thus, I have called out the
shortcuts below instead of hiding them.

## Highlights

There are five things worth pointing out before getting into the details.

First, the project has seven JPA entities with a full relational graph, including a many-to-many
join table (`excursion_cartitem`) between cart items and excursions. Getting that relationship to
actually persist was the hardest part of the project and took several passes.

Second, most of the API is generated rather than written. Seven repository interfaces extend
`JpaRepository`, and Spring Data REST turns each one into a paginated HAL (Hypertext Application
Language) resource with full CRUD (Create, Read, Update, Delete) and navigable association links.
There are no hand-written controllers for those; the repository interfaces are literally one line
each.

Third, there is exactly one hand-written controller, for the one place the generated API was not
enough. Checkout has to assemble a customer, a cart, and a set of cart items in a single transaction
and hand back a tracking number, which is not something you can express as CRUD on a single
resource. That is `POST /api/checkout/purchase`.

Fourth, checkout is transactional and generates a UUID (Universally Unique Identifier) order
tracking number, so the front end has something to show the user immediately after purchase.

Finally, the Spring Data REST configuration is not the default. Entity IDs are exposed in JSON
payloads (off by default), and pagination is effectively disabled so the front end can pull whole
collections in one request.

## Technical walkthrough

### Domain model

The domain model is seven entities, related as shown below:

```
Country 1──* Division 1──* Customer 1──* Cart 1──* CartItem *──1 Vacation
                                                      │              │
                                                      │              1
                                                      *──────────────*
                                                          Excursion
```

A **Vacation** is a vacation package with a title, description, `travel_fare_price`, and image URL.
An **Excursion** is an optional add-on that belongs to exactly one vacation, with its own title,
price, and image URL. In other words, a vacation owns a list of excursions, and you can only pick
excursions offered by the vacation you are buying.

A **CartItem** is one vacation in a cart, plus the set of excursions chosen for it. The
vacation-to-cart-item link is many-to-one. However, the excursion-to-cart-item link is many-to-many
through `excursion_cartitem`, because the same excursion can appear in many different people's cart
items.

A **Cart** is the order itself: `order_tracking_number`, `package_price`, `party_size`, and a
`status` enum (`pending`, `ordered`, `canceled`). The status is persisted as a string via
`@Enumerated(EnumType.STRING)` instead of as an ordinal int. This will keep the values readable in
the database, and they will not break if I reorder the enum.

A **Customer** holds a name, address, postal code, phone, and a link to a Division. **Country** and
**Division** are location reference data (i.e., country, then state or province), used to normalize
customer addresses instead of storing free-text location strings on the customer.

Every entity carries `create_date` and `last_update` columns managed by Hibernate's
`@CreationTimestamp` and `@UpdateTimestamp`, so I never set audit timestamps by hand. Lombok's
`@Getter`, `@Setter`, `@NoArgsConstructor`, and `@AllArgsConstructor` handle the boilerplate. JPA
requires a no-arg constructor, which is why `@NoArgsConstructor` is on most entities.

### Why Spring Data REST instead of hand-written controllers

The front end needed plain CRUD over seven tables. Writing seven `@RestController` classes with five
methods each would have been roughly 35 methods of identical delegate-to-repository code, and every
one of them is a place to introduce a typo.

Spring Data REST reads the repository interfaces and generates the HTTP layer at runtime, including
association subresources. Thus, `GET /api/vacations/1/excursions` works without me writing anything.
The entire persistence and API layer for a table is this:

```java
@CrossOrigin
public interface VacationRepository extends JpaRepository<Vacation, Long> {}
```

Unfortunately, the trade-off is real. Because there is no DTO (Data Transfer Object) layer, the API
shape is the database shape: entity fields are the JSON contract, and a column rename is a breaking
API change. There is also nowhere to put business rules, which is exactly why checkout had to be
written by hand. For a project this size, I would make the same call again. However, for anything
with real business logic, I would want explicit controllers and DTOs.

### Why MySQL

The schema is genuinely relational, with five foreign key relationships and a join table, and orders
need to be written atomically. Thus, a relational database with transactions was the right fit.

I chose MySQL specifically because it is what I was set up with locally (not the most scientific
selection process). Nothing here is MySQL-specific beyond the dialect and driver, so moving to
Postgres would simply be a driver swap and a dialect change.

### Spring Data REST configuration

`RestDataConfig` implements `RepositoryRestConfigurer` and changes two defaults:

```java
config.exposeIdsFor(Country.class);
config.exposeIdsFor(Customer.class);
config.exposeIdsFor(Division.class);
config.exposeIdsFor(Excursion.class);
config.exposeIdsFor(Vacation.class);
config.setDefaultPageSize(Integer.MAX_VALUE);
config.setMaxPageSize(Integer.MAX_VALUE);
```

The first change is `exposeIdsFor(...)`. By default, Spring Data REST hides primary keys and expects
clients to navigate by HAL link. However, the front end needed the numeric IDs in the JSON body, so
I opted those five entities in. You will note that `Cart` and `CartItem` are deliberately not in that
list, because those are written through checkout, not read by ID.

The second change disables pagination. The front end wanted full lists (all vacations, all
excursions, all countries) in one call rather than paging through them, and setting the page size to
`Integer.MAX_VALUE` is the blunt way to do that. It is fine at reference-data scale; however, it
would fall over on a real `carts` table, and proper pagination is the correct fix.

### Endpoints

Spring Data REST exposes each repository under the `/api` base path, pluralized from the entity name:

| Resource | Methods |
|---|---|
| `/api/vacations` | GET, POST, PUT, PATCH, DELETE |
| `/api/excursions` | GET, POST, PUT, PATCH, DELETE |
| `/api/customers` | GET, POST, PUT, PATCH, DELETE |
| `/api/countries` | GET, POST, PUT, PATCH, DELETE |
| `/api/divisions` | GET, POST, PUT, PATCH, DELETE |
| `/api/carts` | GET, POST, PUT, PATCH, DELETE |
| `/api/cartItems` | GET, POST, PUT, PATCH, DELETE |

Each collection also supports `/api/{resource}/{id}` and association subresources for the entity's
relationships. A few examples:

```
GET /api/vacations/1/excursions     excursions offered by a vacation
GET /api/customers/1/carts          a customer's carts
GET /api/carts/1/cartItems          items in a cart
GET /api/cartItems/1/excursions     excursions chosen for a cart item
GET /api/divisions/1/country        the country a division belongs to
```

`GET /api/profile` is the entry point to the generated ALPS (Application-Level Profile Semantics)
metadata, with per-resource descriptors at `/api/profile/{resource}`.

Because every repository is annotated with a bare `@CrossOrigin`, these endpoints will accept
cross-origin requests from **any** origin. That was a convenience during development, not a decision
I would ship.

### The one hand-written endpoint: checkout

```
POST /api/checkout/purchase
```

The request body (`PurchaseData`) contains a `customer`, a `cart`, and a set of `cartItems`. The
response (`PurchaseResponse`) is simply `{ "orderTrackingNumber": "<uuid>" }`.

Here is where things were a little complicated. `CheckoutServicesImpl.checkout()` is annotated
`@Transactional` and runs in five parts: first, it nulls out the incoming cart ID, generates a
tracking number, wires up both sides of the relationships, sets the cart status, then saves
everything in parent-to-child order. A few of those need explaining.

Nulling out the cart ID is necessary because the Angular front end sends `id: 0` for a new cart,
which JPA would interpret as "update cart 0" rather than "insert." Setting it to `null` forces
MySQL's `AUTO_INCREMENT` to assign a real one. This is commented inline in the code, because it is
the kind of thing that looks like a mistake six months later.

The tracking number is simply `UUID.randomUUID().toString()`, set on the cart.

Wiring the relationships is where the first version went wrong. `Cart.add(CartItem)` and
`Customer.add(Cart)` are helper methods on the entities that set the child's back-reference at the
same time they add to the parent's collection. Skipping that back-reference is what caused the
foreign keys to come out null the first time I wrote this.

After that, the cart status is set to `ordered`, and the customer, cart, and cart items are saved in
that order. Parent rows have to exist before the children that reference them, the same way a
shipment has to exist in the system before parcels can be assigned to it. Because the whole thing is
one transaction, a failure partway through will not leave an order half-written.

To address the elephant in the room, why not just POST the customer, cart, and cart items through
the generated endpoints and skip the controller entirely? This will simply not work, because those
would be three separate requests and three separate transactions. If the last one failed, the
database would be left holding a customer and a cart with nothing in it, and there would still be
nowhere to generate the tracking number. Thus, checkout needs one endpoint that owns the whole
transaction.

`CheckoutServices` is an interface with a single implementation, and `CheckoutController` takes it
via constructor injection. That is more indirection than a project this size needs (an interface
with exactly one implementation is admittedly a bit ceremonial), but it keeps the controller unaware
of the persistence code.

Unlike the repositories, the checkout controller restricts CORS to a single origin:
`@CrossOrigin("http://localhost:4200")`.

## Limitations and known rough edges

There is a fair amount that is not done here, and I would rather state it plainly than have someone
find it. The known issues fall into five groups: setup, security, input handling, entity mapping,
and testing.

The biggest setup issue is that there is no schema in the repo. With `ddl-auto=none`, no
`schema.sql`, and no migration tool, you cannot clone this and run it; you have to reconstruct the
tables from the entity classes. Adding Flyway is the single highest-value fix.

Relatedly, the seed data loader is not idempotent and hardcodes `division_id = 42`. It will
duplicate five customers on every restart and throw if division 42 does not exist. At minimum, it
should be behind a Spring profile.

In terms of security, the database credentials are committed in `application.properties` instead of
coming from environment variables or a secrets store. On top of that, there is no authentication or
authorization. Spring Security is not on the classpath, so every endpoint, including
`DELETE /api/customers/1`, is open to anyone who can reach the port.

Input handling has three gaps. First, there is no request validation. `Customer` has
`nullable = false, length = 50` column constraints, but those are database-level, not
application-level. Because there is no Bean Validation (`@NotBlank`, `@Size`) and no
`spring-boot-starter-validation`, bad input fails as a database error rather than a clean 400.

Second, checkout has no error handling. There is no `@ControllerAdvice` and no validation of the
purchase payload, so a malformed request will surface as a stack trace.

Third, cart totals are not calculated server-side. `package_price` is whatever the client sends,
which means the client decides the price (the equivalent of letting the customer write their own
receipt). Real checkout would recompute it from the vacation and excursion prices on the server.

The entity mapping has two problems. `Division` maps `country_id` twice: once as a read-only
`@ManyToOne` association (`insertable = false, updatable = false`) and once as a raw `Long` column.
Relatedly, `Country.divisions` uses `mappedBy = "country_id"`, pointing at that raw column rather
than at the `country` association. It works for the reads the front end does, but it is not how the
mapping should be expressed, and it is on my list to clean up.

Both sides of the CartItem to Excursion many-to-many also declare `@JoinTable` on
`excursion_cartitem` instead of one side using `mappedBy`. In other words, neither side is the
inverse side, and Hibernate can attempt to write the same join row from both directions.

Finally, tests are effectively absent. `EcommerceappApplicationTests` only asserts that the Spring
context loads, and even that needs a live MySQL instance. Checkout, the only real logic in the
project, has no test coverage.

Overall, the project does what it was built to do, which was to teach me how JPA relationships and
Spring Data REST behave in practice. However, it is not something I would deploy as is, and Flyway
would be the first thing added.

## Project layout

The source is laid out as follows:

```
src/main/java/me/wsehsatnoen/ecommerceapp/
├── EcommerceappApplication.java   entry point
├── bootstrap/BootStrapData.java   CommandLineRunner seed data
├── config/RestDataConfig.java     Spring Data REST customization
├── controllers/                   CheckoutController (the only controller)
├── dao/                           7 JpaRepository interfaces
├── entities/                      7 JPA entities + StatusType enum
└── services/                      checkout service, request/response objects
```