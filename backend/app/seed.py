from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.category import Category
from app.models.supplier import Supplier
from app.models.ingredient import Ingredient
from app.models.product import Product
from app.models.recipe import Recipe, RecipeItem
from app.core.security import get_password_hash

def seed_database(db: Session):
    # 1. Users
    if db.query(User).count() == 0:
        admin = User(
            username="admin",
            email="admin@bakery.com",
            password_hash=get_password_hash("admin123"),
            role="ADMIN"
        )
        manager = User(
            username="manager",
            email="manager@bakery.com",
            password_hash=get_password_hash("manager123"),
            role="MANAGER"
        )
        db.add_all([admin, manager])
        db.commit()

        staff = User(
            username="staff",
            email="staff@bakery.com",
            password_hash=get_password_hash("staff123"),
            role="STAFF",
            manager_id=manager.id
        )
        db.add(staff)
        db.commit()
    else:
        # Update existing staff user if manager_id is missing
        manager = db.query(User).filter(User.role == "MANAGER").first()
        staff = db.query(User).filter(User.role == "STAFF", User.manager_id == None).first()
        if manager and staff:
            staff.manager_id = manager.id
            db.commit()

    # 2. Categories
    if db.query(Category).count() == 0:
        cats = [
            Category(name="Cake", description="Freshly baked whole cakes"),
            Category(name="Pastry", description="Single serving pastry slices"),
            Category(name="Donut", description="Glazed and filled donuts"),
            Category(name="Croissant", description="Flaky butter pastries"),
            Category(name="Muffin", description="Soft breakfast muffins"),
            Category(name="Brownie", description="Fudgy chocolate brownies"),
            Category(name="Bread", description="Artisan loaves and rolls"),
            Category(name="Other", description="Miscellaneous items")
        ]
        db.add_all(cats)
        db.commit()

    # 3. Suppliers
    if db.query(Supplier).count() == 0:
        suppliers = [
            Supplier(name="Golden Grain Flour Co.", contact_person="John Miller", phone="555-0192", email="john@goldengrain.com", address="100 Mill Road"),
            Supplier(name="Sweet Valley Sugar & Dairy", contact_person="Sarah Connor", phone="555-0144", email="sarah@sweetvalley.com", address="45 Dairy Lane"),
            Supplier(name="Cocoa Craft Ingredients", contact_person="Carlos Ray", phone="555-0188", email="carlos@cocoacraft.com", address="12 Cocoa Blvd")
        ]
        db.add_all(suppliers)
        db.commit()

    # 4. Ingredients
    if db.query(Ingredient).count() == 0:
        sup_flour = db.query(Supplier).filter(Supplier.name.contains("Flour")).first()
        sup_dairy = db.query(Supplier).filter(Supplier.name.contains("Sugar")).first()
        sup_cocoa = db.query(Supplier).filter(Supplier.name.contains("Cocoa")).first()

        next_month = datetime.utcnow() + timedelta(days=30)

        ingredients = [
            Ingredient(name="Flour", unit="KG", quantity=50.0, minimum_quantity=15.0, cost_per_unit=2.50, expiry_date=next_month, supplier_id=sup_flour.id if sup_flour else None),
            Ingredient(name="Sugar", unit="KG", quantity=30.0, minimum_quantity=10.0, cost_per_unit=1.80, expiry_date=next_month, supplier_id=sup_dairy.id if sup_dairy else None),
            Ingredient(name="Butter", unit="KG", quantity=20.0, minimum_quantity=5.0, cost_per_unit=6.00, expiry_date=next_month, supplier_id=sup_dairy.id if sup_dairy else None),
            Ingredient(name="Eggs", unit="PIECE", quantity=200.0, minimum_quantity=50.0, cost_per_unit=0.25, expiry_date=next_month, supplier_id=sup_dairy.id if sup_dairy else None),
            Ingredient(name="Cocoa Powder", unit="KG", quantity=10.0, minimum_quantity=3.0, cost_per_unit=8.50, expiry_date=next_month, supplier_id=sup_cocoa.id if sup_cocoa else None),
            Ingredient(name="Chocolate Chips", unit="KG", quantity=15.0, minimum_quantity=4.0, cost_per_unit=9.00, expiry_date=next_month, supplier_id=sup_cocoa.id if sup_cocoa else None),
            Ingredient(name="Fresh Cream", unit="LITER", quantity=25.0, minimum_quantity=8.0, cost_per_unit=4.00, expiry_date=next_month, supplier_id=sup_dairy.id if sup_dairy else None),
            Ingredient(name="Milk", unit="LITER", quantity=40.0, minimum_quantity=10.0, cost_per_unit=1.50, expiry_date=next_month, supplier_id=sup_dairy.id if sup_dairy else None),
            Ingredient(name="Vanilla Extract", unit="ML", quantity=1000.0, minimum_quantity=200.0, cost_per_unit=0.05, expiry_date=next_month, supplier_id=sup_cocoa.id if sup_cocoa else None),
        ]
        db.add_all(ingredients)
        db.commit()

    # 5. Products
    if db.query(Product).count() == 0:
        cat_cake = db.query(Category).filter(Category.name == "Cake").first()
        cat_pastry = db.query(Category).filter(Category.name == "Pastry").first()
        cat_muffin = db.query(Category).filter(Category.name == "Muffin").first()
        cat_croissant = db.query(Category).filter(Category.name == "Croissant").first()
        cat_brownie = db.query(Category).filter(Category.name == "Brownie").first()

        next_week = datetime.utcnow() + timedelta(days=5)

        products = [
            Product(name="Chocolate Cake", category_id=cat_cake.id, description="Rich 3-layer chocolate fudge cake", selling_price=35.00, cost_price=12.00, quantity=8.0, minimum_stock=3.0, expiry_date=next_week),
            Product(name="Black Forest Cake", category_id=cat_cake.id, description="Classic German cherry and cream cake", selling_price=38.00, cost_price=14.00, quantity=5.0, minimum_stock=2.0, expiry_date=next_week),
            Product(name="Red Velvet Cake", category_id=cat_cake.id, description="Smooth red velvet with cream cheese frosting", selling_price=36.00, cost_price=13.00, quantity=4.0, minimum_stock=2.0, expiry_date=next_week),
            Product(name="Chocolate Pastry", category_id=cat_pastry.id, description="Individual slice of dark chocolate pastry", selling_price=5.50, cost_price=2.00, quantity=15.0, minimum_stock=5.0, expiry_date=next_week),
            Product(name="Butter Croissant", category_id=cat_croissant.id, description="Flaky French butter croissant", selling_price=3.50, cost_price=1.10, quantity=25.0, minimum_stock=10.0, expiry_date=next_week),
            Product(name="Blueberry Muffin", category_id=cat_muffin.id, description="Moist muffin loaded with blueberries", selling_price=4.00, cost_price=1.30, quantity=18.0, minimum_stock=6.0, expiry_date=next_week),
            Product(name="Fudge Brownie", category_id=cat_brownie.id, description="Rich Belgian chocolate fudge brownie", selling_price=4.50, cost_price=1.50, quantity=12.0, minimum_stock=4.0, expiry_date=next_week),
        ]
        db.add_all(products)
        db.commit()

    # 6. Recipes
    if db.query(Recipe).count() == 0:
        choc_cake = db.query(Product).filter(Product.name == "Chocolate Cake").first()
        flour = db.query(Ingredient).filter(Ingredient.name == "Flour").first()
        sugar = db.query(Ingredient).filter(Ingredient.name == "Sugar").first()
        butter = db.query(Ingredient).filter(Ingredient.name == "Butter").first()
        eggs = db.query(Ingredient).filter(Ingredient.name == "Eggs").first()
        cocoa = db.query(Ingredient).filter(Ingredient.name == "Cocoa Powder").first()
        cream = db.query(Ingredient).filter(Ingredient.name == "Fresh Cream").first()

        if choc_cake and flour and sugar and butter and eggs and cocoa and cream:
            recipe = Recipe(
                product_id=choc_cake.id,
                instructions="Mix dry ingredients, add beaten eggs and melted butter. Bake at 180C for 35 mins.",
                recipe_items=[
                    RecipeItem(ingredient_id=flour.id, quantity_required=0.5),    # 0.5 KG
                    RecipeItem(ingredient_id=sugar.id, quantity_required=0.3),    # 0.3 KG
                    RecipeItem(ingredient_id=cocoa.id, quantity_required=0.1),    # 0.1 KG
                    RecipeItem(ingredient_id=butter.id, quantity_required=0.2),   # 0.2 KG
                    RecipeItem(ingredient_id=eggs.id, quantity_required=4.0),     # 4 PIECE
                    RecipeItem(ingredient_id=cream.id, quantity_required=0.25),   # 0.25 LITER
                ]
            )
            db.add(recipe)
            db.commit()
