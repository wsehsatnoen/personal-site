---
# Copy this file to a new name (for example staffing-forecast.md) and edit.
# Delete `draft: true` to make it appear on the portfolio page.
# This file stays hidden as long as draft is true.

title: WGUPS
description: Parsel route generator, built from scratch hash table, floyd-warshall, nearest-neighbor.
stack:
  - python
link: https://github.com/wsehsatnoen/wgups
featured: false   # true renders a wide, olive card
span: 3           # optional: 4, 5, 6, 7 or 8. Ignored when featured is true.
order: 3          # lower numbers sort first
draft: false
---

# WGUPS Application
*A WMS (Warehouse Management System) created for WGU's C950 Task Two PA.*

When starting this project, the focus was to develop an understanding of different Data Structures
and Algorithms, hence the name of the class. However, my attempt was to take it slightly further.


Because the class is heavily function based, I decided to challenge myself and deviate away from OOP
(Object-Oriented Programming), and practice FP (Functionality Programming). By doing so, I minimized
the number of classes that I used down to only 3 (okay, more if you consider the empty bucket/enum classes).

For the purpose of this assignment, that is besides the point, so here is a quick documentation of where everything
is and how the program flows:

---
### SECTION A
*THE HASH TABLE*

There are two files that build this: packages.py and hashtable.py. The packages.py file is where the buckets are created
and the hashtable.py is what initiates and stores items into a hash table. However, first the items must be hashed (located
in package.py line 40):

    def hash(package: Package):
        return package.id

Because each package has a unique ID, there is no need to hash in any other way than a direct hash. 

Now that we have our hash function, the insertion function is on the hashtable.py file starting at line: 47.

    def insert(self, package: Package):
        for i in range(self.size):
            index = (hash(package) + i + i * i) % self.size
            if self.table[index].is_empty():
                self.table[index] = package
                return
        self.resize(package)

You will note, the insertion algorithm here uses a quadratic probing method that will continuously search for an empty
bucket to place the package in. If none is found, that is where self.resize() is called to resize the hash table.

---
### SECTION B
*THE LOOKUP FUNCTION*

This function is located at line 31 in the hashtable.py file. To look up items, we simply execute the same quadratic function
to find the bucket:

    def get_bucket(self, key):
        for i in range(self.size):
            index = (key + i + i * i) % self.size
            if self.table[index].is_empty_since_start():
                return None
            if self.table[index].is_empty_after_removal():
                continue
            if int(self.table[index].get_id()) == key:
                return self.table[index]
        return None

However, the difference here is the use of EMPTY_SINCE_START vs. EMPTY_AFTER_REMOVAL.
These were created using a helper class and initializing them with those two attributes.

    class PackageBucket:
    
        def is_empty(self):
            if self is PackageBucket.EMPTY_SINCE_START:
                return True
            return self is PackageBucket.EMPTY_AFTER_REMOVAL
    
        def is_empty_since_start(self):
            return self is PackageBucket.EMPTY_SINCE_START
    
        def is_empty_after_removal(self):
            return self is PackageBucket.EMPTY_AFTER_REMOVAL
    
        def __str__(self):
            if self.is_empty_since_start():
                return "Empty Since Start"
            elif self.is_empty_after_removal():
                return "Empty After Removal"
            else:
                return None

    PackageBucket.EMPTY_SINCE_START = PackageBucket()
    PackageBucket.EMPTY_AFTER_REMOVAL = PackageBucket()

Because we used this, instead of creating a separate list to store which buckets are empty, and to prevent
issues with functionality, we can instead initialize the entire hash table with PackageBucket.EMPTY_SINCE_START object,
and insert PackageBucket.EMPTY_AFTER_REMOVAL whenever something is removed from the table.

    def __init__(self, initial_size: int = 40):
        self.table = [PackageBucket.EMPTY_SINCE_START] * initial_size
        self.size = initial_size

---
### SECTION C
*THE ORIGINAL PROGRAM*

Here is where things were a little complicated. With the challenge as mentioned above, the only other class that was used
was the Truck class. Given my experience as an e-Commerce Warehouse Coordinator on both the shipping and receiving ends,
I used my experience working with our systems to develop one that is similar in aspects.

##### Receiving:

The first thing that needed to happen was receiving each of the packages. That was done simply by using python's CSV reader:

    def receive_package():
        with open("packages.csv", "r") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                package = Package(row['id'], row['address'], row['city'], row['state'], row['zipcode'], row['delivery_deadline'], row['weight'], row['notes'])
                handle_package(package)
                wgups_table.insert(package)

Note that first the package is created in the package class, then handled, then inserted into the wpups_table (an instance of
our Hash Table used for this application). This follows the same SOP (standard operating procedure) for traditional 
warehousing via receive, sort, and putaway. 

The second portion of handling allows for special notes to be taken care of, 
standardizing data types, and finally sorting the package ID's into specific sets based on specific conditions.

    def handle_package(package):
        update_deadline(package)
        handle_notes(package)
        if package.get_id() in delayed_package_ids:
            package.update_status(Status.LABEL_CREATED, datetime.time(7, 30))
            return
        address_mixer(package)
        package.update_status(Status.AT_HUB, datetime.time(7, 30))
        if package.get_id() in truck_two_packages or package.get_id() in paired_packages:
            return
        if package.get_deadline() < datetime.time(17, 00):
            priority_set.add(package.get_id())
            return
        loading_queue.add(package.get_id())

On a side note, because we are not creating any object, all the data for this application will be stored and manipulated
from the global_variables.py file. Also, packages that are delayed on flight or have the wrong address listed are handled
separately at the given time they are available, then sorted to their designated set.

##### Shipping:

After the packages have been received, sorted, and putaway (inserted into the hash table), now the manifests and routes are 
ready to be built. There is a requirement that the total miles traveled does not exceed 140 miles. To combat this, we 
avoided arriving at a location more than once, so above in receiving you will notice the address_mixer(package) function. 
Each package ID will not only be placed into a set based on conditions, but will also be paired with others that are to 
be delivered at the same address in a dictionary.

With that in mind, our manifest builder is able to build a route via the sets package IDs have been sorted into. Then it will load
packages that are going to the same address onto that shipment as well (with the 16 package capacity in consideration):

    def build_manifest(packages):
        manifest = {}
        count = 0
        packages_in_manifest = set()
    
        for id in packages:
            package = wgups_table.get_bucket(id)
            same_address = addresses[package.get_address()]

            if count + len(same_address[1]) <= 16 and package.get_address() not in manifest:
                manifest[package.get_address()] = copy.deepcopy(same_address)
                count += len(same_address[1])
                packages_in_manifest.update(same_address[1])
    
        account_for_packages(packages_in_manifest)
    
        return manifest, packages_in_manifest

Once a manifest is built, the packages that are on this manifest are removed from the sets and address dictionary so they
are not attempted to be added to a different manifest.

##### Route Building: 
Now with the manifest built, the route can be generated. The two algorithms that are used are Nearest Neighbor and Floyd-Warshall.
The locations and respective matrix between each of the locations is located in the location.py file. 

The map of Salt Lake City, Utah and addresses does not meet triangular inequality, meaning that there are instances of two points where the shortest
distance between is not a direct connection. This is where Floyd-Warshall's algorithm used to find the shortest distance
between two addresses and a new matrix with those edges is stored.

    def floyd_warshall(graph, size):
        for intermediate in range(size):
            for start in range(size):
                for end in range(size):
                    new_distance = (graph[start][intermediate] + graph[intermediate][end])
                    if new_distance < graph[start][end]:
                        graph[start][end] = new_distance
        return graph

    all_pairs_shortest_path = floyd_warshall(distance_matrix, num_addresses)

With that matrix built, the greedy Nearest Neighbor algorithm can now quickly find a near optimal route:

    def nearest_neighbor(nodes):

        current_node = 0
        path = []
    
        unvisited_nodes = nodes
        while unvisited_nodes:
            min_node = unvisited_nodes[0]
            min_dis = math.inf
            for node in unvisited_nodes:
                if all_pairs_shortest_path[current_node][locations[node]] < min_dis:
                    min_node = node
                    min_dis = all_pairs_shortest_path[current_node][locations[node]]
            path.append(min_node)
            unvisited_nodes.remove(min_node)
            current_node = locations[min_node]
        return path

With these two algorithms, now the routes for our manifests can be generated. Because the manifest builder is pulling from 
both the sets and address dictionary, there are some packages that are on that shipment that have a delivery deadline. These addresses
will be delivered to first, then those who do not have a delivery deadline will be delivered to second:

    def build_route(manifest):
        priority_list = []
        non_priority_list = []
    
        route = []
    
        for address, info in manifest.items():
            if info[0] < datetime.time(17, 0):
                priority_list.append(address)
            else:
                non_priority_list.append(address)
    
        route.extend(nearest_neighbor(priority_list))
        route.extend(nearest_neighbor(non_priority_list))
    
        route.insert(0, "HUB")
        route.append("HUB")
    
        distance = get_route_distance(route)
    
        return route, distance

Once the manifests are built and the route generated, the shipments are ready to be shipped! On the main.py file, this is
where all the algorithms come together to complete the application. 

    receive_package()

    manifest_one, packages_one = build_manifest(paired_packages.union(truck_two_packages))
    total_miles += ship(manifest_one, packages_one, truck_one, 1, datetime.time(8, 0))
    
    delayed_package_handler(datetime.time(9, 5))
    manifest_two, packages_two = build_manifest(priority_set)
    total_miles += ship(manifest_two, packages_two, truck_two, 2, datetime.time(9, 5))
    
    delayed_package_handler(datetime.time(10, 20))
    manifest_three, packages_three = build_manifest(loading_queue)
    total_miles += ship(manifest_three, packages_three, truck_three, 1, datetime.time(10, 25))
    
    current_time = datetime.time(7, 30)

The first manifest is build via the paired packages and truck two packages. The second is built with the priority set, but does
not depart until 9:05 to get the delayed packages on board. Then finally, the last shipment is build with the remaining loading
queue set that will deliver the final packages after truck two and driver 1 arrive back at the hub at 10:25.

### SECTION D & E
*THE USER INTERFACE AND SCREENSHOTS

This one was a little challenging because there are a lot of edge cases that the user could do that could cause errors.
To prevent those, we kept it simple and robust. There are only four options to choose from, show dashboard to see all the
packages and the trucks, change time to add time to the simulation, view a package and its status at a requested time, and exit. 
The simulation will start at 7:30 am and show all the packages that have been received and sorted and those that are not 
in facility via Label Created. The routes have already been pre-planned and the purpose of the simulation is to simply 
see the statuses at given times of the day.

Given a time constraint, there is much more that can be added (such as allowing the user to traverse backwards in addition
to forwards in time) to improve it. For the purpose of this assignment, however, what is created will satisfy.

### SECTION F
*ALGORITHM VERIFICATION AND JUSTIFICATION*

The two algorithms used to build the routes, Nearest Neighbor and Floyd-Warshall, have many strengths. One is, Floyd-Warshall 
is able to provide the shortest distance between all points on the graph, whether that includes an intermediate or not.
Another is, Nearest Neighbor algorithm, in the case used for this application, will take the list of locations from the 
manifest and continuously return the next nearest neighbor, minimizing the distance traveled. 

After running the application, all packages are delivered to their designation and on time, the number of miles traveled is 112.90 
miles, and all packages notes are successfully handled (i.e. packages delivered with required packages, truck two packages).

There are other algorithms that could have been used for this application that would also meet the requirements:

One which is more complicated is Christofides' algorithm. Christofides' takes a cycle of points and creates a path through 
each of them that is 1.5 times the optimal solution. [[1]](#1) The complication, however, is it requires that the graph meet triangular 
inequality, which in our case, it does not. However, that can be fixed simply using Floyd-Warshall to find the shortest 
path between all points to instantiate triangular inequality. This one is different from nearest neighbor because it will
prevent a long return leg.

Another algorithm that could be used is Dijkstra's algorithm in place of the Floyd-Warshall algorithm. This will work 
with the nearest neighbor algorithm and find the shortest path to each of the nodes, then the nearest neighbor algorithm 
will choose that location and add it next in the route. The downside of this is running Dijkstra's algorithm multiple time 
can be quite time complex, even though its time complexity alone is NlogN. This one is different from Floyd-Warshall because
it will calculate the shortest distance each time the nearest neighbor is run, freeing memory space.

### SECTION G
*WHAT COULD BE DONE DIFFERENTLY*

If given more time, I would have implemented instead sorted packages that are to be delivered with the same Zipcode. The US
Postal Service has implemented Zipcodes for the benefit of delivery. Instead of only sorting packages that are to be delivered
to the same address, I would also include packages that are within the same zipcode to prevent multiple trucks traveling
in the same area.

### SECTION H
*DATA STRUCTURE VERIFICATION AND JUSTIFICATION*

The Hash Table used successfully satisfies the requirements. There is an insert function that will directly insert the package
into the correct bucket, and a get_bucket function that will return the package if it is in the table. The hash table also provides
a resize function that will resize the table if the load factor exceeds a certain threshold. To hash a package, it will use a direct hash
and quadratic probing. With all of this, the Hash Table satisfies the requirements.

The use of the Hash Table is potentially the best option for storing the packages and their data. However, two other options
are the use of a Linked List and a Min-Heap:

The linked list will store the information just as the Hash Table did, and insertion will be optimal due to simply pending 
at the end of the list. However, retrieval is not given that the Hash Table has a retrieval time complexity of O(1), 
but the linked list has a time complexity of O(N) for it has to iterate through all the buckets until a match. 

The other option is the Min-Heap. This will be optimal, for it can store packages with a priority near the front of the list, 
always returning the earliest priority from the root. However, again, retrieval will have the same complications as that 
of the linked list, with a time complexity of O(N). 

### SECTION I & J
*SOURCES AND PROFESSIONALISM*

<a id="1">[1]: </a>
Krymgand, A. (n.d.). The Christofides algorithm. The Christofides Algorithm. https://alon.kr/posts/christofides

Lysecky, R., & Vahid, F. (2018, June). C950: Data Structures and Algorithms II. zyBooks. Retrieved May 10, 2026, from https://learn.zybooks.com/zybook/WGUC950AY20182019/
