from app.schemas.analytics import DailyStats, MonthlyStats, DailyOverview
from datetime import datetime, timedelta
from typing import List
from bson import ObjectId
from app.db.mongo import users_collection, operations_collection, tasks_collection, expenses_collection

class AnalyticsService:
    @staticmethod
    async def get_daily_overview(admin_id: str) -> DailyOverview:
        today = datetime.utcnow().date()
        start_of_day = datetime(today.year, today.month, today.day)
        end_of_day = start_of_day + timedelta(days=1)
        
        # 1. Pipeline for Operations (Sales, Purchases, Profits)
        ops_pipeline = [
            {"$match": {
                "admin_id": admin_id, 
                "operation_date": {"$gte": start_of_day, "$lt": end_of_day}
            }},
            {"$group": {
                "_id": None,
                "sales": {"$sum": {"$cond": [{"$eq": ["$type", "sale"]}, "$amount", 0]}},
                "purchases": {"$sum": {"$cond": [{"$eq": ["$type", "purchase"]}, "$amount", 0]}},
                "profit": {"$sum": {"$cond": [{"$eq": ["$type", "sale"]}, "$profit", 0]}}
            }}
        ]
        ops_result = await operations_collection.aggregate(ops_pipeline).to_list(length=1)
        res = ops_result[0] if ops_result else {}
        sales = res.get("sales", 0)
        purchases = res.get("purchases", 0)
        operational_profit = res.get("profit", 0)

        # 2. Pipeline for Expenses
        expenses_pipeline = [
            {"$match": {"admin_id": admin_id, "date": {"$gte": start_of_day, "$lt": end_of_day}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        expenses_result = await expenses_collection.aggregate(expenses_pipeline).to_list(length=1)
        expenses = expenses_result[0]["total"] if expenses_result else 0
        
        # 3. Tasks counts (Batching counts if possible, but count_documents is fast with index)
        new_tasks = await tasks_collection.count_documents({
            "admin_id": admin_id,
            "created_at": {"$gte": start_of_day, "$lt": end_of_day}
        })
        completed_tasks = await tasks_collection.count_documents({
            "admin_id": admin_id,
            "status": "completed",
            "updated_at": {"$gte": start_of_day, "$lt": end_of_day}
        })
        
        # 4. Total Stock Value
        pipeline = [
            {"$match": {"admin_id": admin_id, "is_archived": False}},
            {"$group": {
                "_id": None, 
                "total_value": {"$sum": {"$multiply": ["$purchase_price", "$stock"]}}
            }}
        ]
        from app.db.mongo import products_collection
        stats = await products_collection.aggregate(pipeline).to_list(length=1)
        total_stock_value = stats[0]["total_value"] if stats else 0
        
        return DailyOverview(
            sales=sales,
            purchases=purchases,
            global_balance=sales - purchases - expenses,
            profit=operational_profit,
            expenses=expenses,
            net_profit=operational_profit - expenses,
            new_tasks=new_tasks,
            completed_tasks=completed_tasks,
            total_value=total_stock_value
        )

    @staticmethod
    async def get_monthly_stats(admin_id: str) -> MonthlyStats:
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)
        
        # 1. Pipeline for Operations (Sales, Purchases, Profits)
        ops_pipeline = [
            {"$match": {
                "admin_id": admin_id, 
                "operation_date": {"$gte": start_of_month}
            }},
            {"$group": {
                "_id": None,
                "sales": {"$sum": {"$cond": [{"$eq": ["$type", "sale"]}, "$amount", 0]}},
                "purchases": {"$sum": {"$cond": [{"$eq": ["$type", "purchase"]}, "$amount", 0]}},
                "profit": {"$sum": {"$cond": [{"$eq": ["$type", "sale"]}, "$profit", 0]}}
            }}
        ]
        ops_result = await operations_collection.aggregate(ops_pipeline).to_list(length=1)
        res = ops_result[0] if ops_result else {}
        total_sales = res.get("sales", 0)
        total_purchases = res.get("purchases", 0)
        total_operational_profit = res.get("profit", 0)

        # 2. Total expenses
        expenses_pipeline = [
            {"$match": {"admin_id": admin_id, "date": {"$gte": start_of_month}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        expenses_result = await expenses_collection.aggregate(expenses_pipeline).to_list(length=1)
        total_expenses = expenses_result[0]["total"] if expenses_result else 0
        
        # 3. Tasks - Batch aggregation for counts by status
        tasks_agg_pipeline = [
            {"$match": {"admin_id": admin_id, "updated_at": {"$gte": start_of_month}}},
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        tasks_res = await tasks_collection.aggregate(tasks_agg_pipeline).to_list(length=10)
        tasks_map = {r["_id"]: r["count"] for r in tasks_res}
        
        # Need total_tasks (created this month) separately
        total_tasks = await tasks_collection.count_documents({"admin_id": admin_id, "created_at": {"$gte": start_of_month}})

        # 4. Total Stock Value
        pipeline = [
            {"$match": {"admin_id": admin_id, "is_archived": False}},
            {"$group": {
                "_id": None, 
                "total_value": {"$sum": {"$multiply": ["$purchase_price", "$stock"]}}
            }}
        ]
        from app.db.mongo import products_collection
        stats = await products_collection.aggregate(pipeline).to_list(length=1)
        total_stock_value = stats[0]["total_value"] if stats else 0
        
        return MonthlyStats(
            total_sales=total_sales,
            total_purchases=total_purchases,
            global_balance=total_sales - total_purchases - total_expenses,
            total_profit=total_operational_profit,
            total_expenses=total_expenses,
            net_profit=total_operational_profit - total_expenses,
            total_tasks=total_tasks,
            completed_tasks=tasks_map.get("completed", 0),
            in_progress_tasks=tasks_map.get("in_progress", 0) + tasks_map.get("in_delivery", 0),
            cancelled_tasks=tasks_map.get("cancelled", 0),
            total_value=total_stock_value
        )

    @staticmethod
    async def get_weekly_stats(admin_id: str) -> List[DailyStats]:
        now = datetime.utcnow()
        start_of_week_dt = now - timedelta(days=6)
        start_of_week = datetime(start_of_week_dt.year, start_of_week_dt.month, start_of_week_dt.day)
        
        # Aggregate Operations (Sales & Purchases)
        ops_pipeline = [
            {"$match": {
                "admin_id": admin_id,
                "operation_date": {"$gte": start_of_week}
            }},
            {"$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$operation_date"}
                },
                "sales": {"$sum": {"$cond": [{"$eq": ["$type", "sale"]}, "$amount", 0]}},
                "profit": {"$sum": {"$cond": [{"$eq": ["$type", "sale"]}, "$profit", 0]}},
                "purchases": {"$sum": {"$cond": [{"$eq": ["$type", "purchase"]}, "$amount", 0]}}
            }}
        ]
        ops_results = await operations_collection.aggregate(ops_pipeline).to_list(length=10)
        ops_map = {r["_id"]: r for r in ops_results}

        # Aggregate Tasks
        tasks_pipeline = [
            {"$match": {
                "admin_id": admin_id,
                "created_at": {"$gte": start_of_week}
            }},
            {"$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}
                },
                "count": {"$sum": 1}
            }}
        ]
        tasks_results = await tasks_collection.aggregate(tasks_pipeline).to_list(length=10)
        tasks_map = {r["_id"]: r["count"] for r in tasks_results}

        # Aggregate Expenses
        expenses_pipeline = [
            {"$match": {
                "admin_id": admin_id,
                "date": {"$gte": start_of_week}
            }},
            {"$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$date"}
                },
                "total": {"$sum": "$amount"}
            }}
        ]
        expenses_results = await expenses_collection.aggregate(expenses_pipeline).to_list(length=10)
        expenses_map = {r["_id"]: r["total"] for r in expenses_results}

        stats = []
        for i in range(7):
            date = (start_of_week + timedelta(days=i)).date()
            date_str = date.isoformat()
            
            op_data = ops_map.get(date_str, {})
            
            stats.append(DailyStats(
                date=date_str,
                sales=op_data.get("sales", 0),
                purchases=op_data.get("purchases", 0),
                profit=op_data.get("profit", 0),
                tasks=tasks_map.get(date_str, 0),
                expenses=expenses_map.get(date_str, 0)
            ))
        
        return stats

    @staticmethod
    async def get_treasury_report(admin_id: str, start_date: datetime, end_date: datetime):
        # Sales & Operational Profit
        sales_pipeline = [
            {"$match": {"admin_id": admin_id, "type": "sale", "operation_date": {"$gte": start_date, "$lt": end_date}}},
            {"$addFields": {
                "product_id_obj": {
                    "$cond": {
                        "if": {"$and": [{"$ne": ["$product_id", None]}, {"$ne": ["$product_id", ""]}]},
                        "then": {"$toObjectId": "$product_id"},
                        "else": None
                    }
                }
            }},
            {"$lookup": {
                "from": "products",
                "localField": "product_id_obj",
                "foreignField": "_id",
                "as": "product"
            }},
            {"$unwind": {"path": "$product", "preserveNullAndEmptyArrays": True}},
            {"$project": {
                "id": {"$toString": "$_id"},
                "amount": 1,
                "profit": 1,
                "operation_date": 1,
                "product_name": {"$ifNull": ["$product.name", "Produit inconnu"]},
                "product_imei": {"$ifNull": ["$product.imei", "N/A"]},
                "quantity": 1
            }},
            {"$sort": {"operation_date": -1}}
        ]
        sales_list = await operations_collection.aggregate(sales_pipeline).to_list(length=1000)
        
        total_sales = sum(s["amount"] for s in sales_list)
        total_profit = sum(s.get("profit", 0) for s in sales_list)
        sales_count = len(sales_list)

        # Purchases
        purchases_pipeline = [
            {"$match": {"admin_id": admin_id, "type": "purchase", "operation_date": {"$gte": start_date, "$lt": end_date}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
        ]
        purchases_result = await operations_collection.aggregate(purchases_pipeline).to_list(length=1)
        total_purchases = purchases_result[0]["total"] if purchases_result else 0
        purchases_count = purchases_result[0]["count"] if purchases_result else 0

        # Expenses
        expenses_pipeline = [
            {"$match": {"admin_id": admin_id, "date": {"$gte": start_date, "$lt": end_date}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
        ]
        expenses_result = await expenses_collection.aggregate(expenses_pipeline).to_list(length=1)
        total_expenses = expenses_result[0]["total"] if expenses_result else 0
        expenses_count = expenses_result[0]["count"] if expenses_result else 0

        global_balance = total_sales - total_purchases - total_expenses
        net_profit = total_profit - total_expenses

        # Format sales for response
        formatted_sales = []
        for s in sales_list:
            formatted_sales.append({
                "date": s["operation_date"].isoformat(),
                "product_name": s["product_name"],
                "product_imei": s["product_imei"],
                "amount": s["amount"],
                "profit": s.get("profit", 0),
                "quantity": s.get("quantity", 1)
            })

        return {
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "summary": {
                "total_sales": total_sales,
                "sales_count": sales_count,
                "total_purchases": total_purchases,
                "purchases_count": purchases_count,
                "total_expenses": total_expenses,
                "expenses_count": expenses_count,
                "operational_profit": total_profit,
                "net_profit": net_profit,
                "global_balance": global_balance
            },
            "sales": formatted_sales
        }

    @staticmethod
    async def generate_report_pdf(report_data: dict) -> bytes:
        from io import BytesIO
        from xhtml2pdf import pisa
        from jinja2 import Template

        summary = report_data["summary"]
        period = report_data["period"]

        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Helvetica, Arial, sans-serif; color: #333; }}
                .header {{ text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }}
                .summary-box {{ padding: 10px; background-color: #f9f9f9; border: 1px solid #ddd; margin-bottom: 15px; }}
                .title {{ font-size: 18px; font-weight: bold; margin-bottom: 5px; }}
                .label {{ font-weight: bold; }}
                .value {{ float: right; }}
                .net-profit {{ font-size: 20px; color: #16a34a; margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 5px; }}
                .negative {{ color: #dc2626; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th {{ background-color: #f3f4f6; text-align: left; padding: 8px; border-bottom: 1px solid #ddd; font-size: 12px; }}
                td {{ padding: 8px; border-bottom: 1px solid #eee; font-size: 11px; }}
                .text-right {{ text-align: right; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Rapport de Trésorerie</h1>
                <p>Période: {period['start'][:10]} au {period['end'][:10]}</p>
            </div>

            <div class="summary-box">
                <div class="title">Résumé Global</div>
                <div><span class="label">Total Ventes:</span> <span class="value">{summary['total_sales']:,.0f} FCFA</span></div>
                <div><span class="label">Total Achats (Stock):</span> <span class="value">{summary['total_purchases']:,.0f} FCFA</span></div>
                <div><span class="label">Dépenses Opérationnelles:</span> <span class="value">{summary['total_expenses']:,.0f} FCFA</span></div>
                
                <div class="net-profit">
                    <span class="label">Profit Net:</span> 
                    <span class="value">{summary['net_profit']:,.0f} FCFA</span>
                </div>
                <div style="margin-top: 10px;">
                    <span class="label">Solde Global:</span> 
                    <span class="value {'negative' if summary['global_balance'] < 0 else ''}">{summary['global_balance']:,.0f} FCFA</span>
                </div>
            </div>

            <div class="summary-box">
                <div class="title">Détails de l'Activité</div>
                <div><span class="label">Nombre de ventes:</span> <span class="value">{summary['sales_count']}</span></div>
                <div><span class="label">Nombre d'achats:</span> <span class="value">{summary['purchases_count']}</span></div>
                <div><span class="label">Nombre de dépenses:</span> <span class="value">{summary['expenses_count']}</span></div>
                <div><span class="label">Profit Opérationnel (Marge):</span> <span class="value">{summary['operational_profit']:,.0f} FCFA</span></div>
            </div>

            <div class="title" style="margin-top: 20px;">Détails des Ventes</div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Produit</th>
                        <th>IMEI</th>
                        <th class="text-right">Qte</th>
                        <th class="text-right">Prix de Vente</th>
                        <th class="text-right">Profit</th>
                    </tr>
                </thead>
                <tbody>
                    {"".join([f"<tr><td>{s['date'][:10]}</td><td>{s['product_name']}</td><td>{s.get('product_imei', 'N/A')}</td><td class='text-right'>{s['quantity']}</td><td class='text-right'>{s['amount']:,.0f}</td><td class='text-right'>{s['profit']:,.0f}</td></tr>" for s in report_data.get('sales', [])])}
                </tbody>
            </table>

            <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #666;">
                Document généré le {datetime.utcnow().strftime('%d/%m/%Y %H:%M:%S')}
            </div>
        </body>
        </html>
        """
        
        pdf_buffer = BytesIO()
        pisa.CreatePDF(html_content, dest=pdf_buffer)
        return pdf_buffer.getvalue()

    @staticmethod
    async def get_global_stats() -> dict:
        # 1. Total merchants
        total_merchants = await users_collection.count_documents({"role": "admin"})
        
        # 2. Active merchants in the last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_merchants_cursor = operations_collection.aggregate([
            {"$match": {"operation_date": {"$gte": thirty_days_ago}}},
            {"$group": {"_id": "$admin_id"}}
        ])
        active_merchants_list = await active_merchants_cursor.to_list(length=1000)
        active_merchants_count = len(active_merchants_list)

        # 3. Total sales volume & total profit
        overall_stats = await operations_collection.aggregate([
            {"$match": {"type": "sale"}},
            {"$group": {
                "_id": None,
                "total_volume": {"$sum": "$amount"},
                "total_profit": {"$sum": "$profit"}
            }}
        ]).to_list(length=1)
        total_volume = overall_stats[0]["total_volume"] if overall_stats else 0
        total_profit = overall_stats[0]["total_profit"] if overall_stats else 0

        # 4. Growth data for the last 6 months
        growth = []
        now = datetime.utcnow()
        six_months_ago = (now - timedelta(days=150)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Batch Volume aggregation
        volume_pipeline = [
            {"$match": {"type": "sale", "operation_date": {"$gte": six_months_ago}}},
            {"$group": {
                "_id": {
                    "year": {"$year": "$operation_date"},
                    "month": {"$month": "$operation_date"}
                },
                "total": {"$sum": "$amount"}
            }}
        ]
        volume_results = await operations_collection.aggregate(volume_pipeline).to_list(length=12)
        volume_map = {f"{r['_id']['year']}-{r['_id']['month']}": r["total"] for r in volume_results}

        for i in range(5, -1, -1):
            date = datetime.utcnow() - timedelta(days=i*30)
            month_start = datetime(date.year, date.month, 1)
            next_month_start = (month_start + timedelta(days=32)).replace(day=1)
            
            m_merchants = await users_collection.count_documents({
                "role": "admin",
                "created_at": {"$lt": next_month_start}
            })
            
            key = f"{month_start.year}-{month_start.month}"
            m_volume = volume_map.get(key, 0)

            growth.append({
                "date": month_start.strftime("%b %Y"),
                "merchant_count": m_merchants,
                "volume": m_volume
            })

        # 5. Top 5 merchants
        top_merchants_pipeline = [
            {"$match": {"type": "sale"}},
            {"$group": {"_id": "$admin_id", "total_sales": {"$sum": "$amount"}}},
            {"$sort": {"total_sales": -1}},
            {"$limit": 5},
            # Join with users to get name/email
            # Need to convert string _id to ObjectId for join if needed, 
            # but usually admin_id in operations is string and _id in users is ObjectId or vice versa.
            # In this app, users._id is ObjectId, operations.admin_id is string.
        ]
        top_merchants_raw = await operations_collection.aggregate(top_merchants_pipeline).to_list(length=5)
        
        top_merchants = []
        if top_merchants_raw:
            merchant_ids = [m["_id"] for m in top_merchants_raw]
            
            # Fetch all required users in one shot
            user_object_ids = [ObjectId(mid) for mid in merchant_ids if ObjectId.is_valid(mid)]
            users = await users_collection.find({"_id": {"$in": user_object_ids}}).to_list(length=5)
            user_map = {str(u["_id"]): u for u in users}
            
            # Batch count active tasks for these merchants
            tasks_agg = await tasks_collection.aggregate([
                {"$match": {
                    "admin_id": {"$in": merchant_ids},
                    "status": {"$in": ["in_progress", "in_delivery"]}
                }},
                {"$group": {"_id": "$admin_id", "count": {"$sum": 1}}}
            ]).to_list(length=5)
            tasks_map = {t["_id"]: t["count"] for t in tasks_agg}
            
            for m in top_merchants_raw:
                mid = m["_id"]
                user_doc = user_map.get(mid)
                if user_doc:
                    top_merchants.append({
                        "id": mid,
                        "name": user_doc.get("name", "Inconnu"),
                        "email": user_doc.get("email", ""),
                        "total_sales": m.get("total_sales", 0),
                        "active_tasks": tasks_map.get(mid, 0)
                    })

        # 6. Retour sûr : toujours un dict complet
        return {
            "total_merchants": total_merchants,
            "active_merchants_30d": active_merchants_count,
            "total_volume_all_time": total_volume,
            "total_profit_all_time": total_profit,
            "growth": growth,
            "top_merchants": top_merchants
        }

    @staticmethod
    async def get_category_stats(admin_id: str, start_date: datetime = None, end_date: datetime = None) -> dict:
        """
        Get sales and profit statistics grouped by product category.
        Returns category-wise breakdown for sold products.
        """
        from app.db.mongo import products_collection
        
        # Build match filter
        match_filter = {"admin_id": admin_id, "is_archived": True}  # Sold products
        
        if start_date and end_date:
            match_filter["sold_at"] = {"$gte": start_date, "$lt": end_date}
        
        # Aggregation pipeline
        pipeline = [
            {"$match": match_filter},
            {"$group": {
                "_id": "$category",
                "total_sales": {"$sum": "$selling_price"},
                "total_profit": {"$sum": {"$subtract": ["$selling_price", "$purchase_price"]}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"total_sales": -1}}
        ]
        
        results = await products_collection.aggregate(pipeline).to_list(length=100)
        
        # Format results
        categories = []
        total_sales = 0
        total_profit = 0
        total_count = 0
        
        for r in results:
            sales = r.get("total_sales", 0) or 0
            profit = r.get("total_profit", 0) or 0
            count = r.get("count", 0)
            
            categories.append({
                "category": r["_id"] or "Non catégorisé",
                "sales": sales,
                "profit": profit,
                "count": count
            })
            
            total_sales += sales
            total_profit += profit
            total_count += count
        
        return {
            "categories": categories,
            "total_sales": total_sales,
            "total_profit": total_profit,
            "total_count": total_count
        }

    @staticmethod
    async def get_yearly_summary(admin_id: str) -> List[MonthlySummary]:
        from app.schemas.analytics import MonthlySummary
        summaries = []
        now = datetime.utcnow()
        # Start of 12 months ago
        # Go back ~360 days to be safe, then find the start of that month
        start_date = (now - timedelta(days=335)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Aggregate Operations (Sales, Purchases, Profit)
        ops_pipeline = [
            {"$match": {"admin_id": admin_id, "operation_date": {"$gte": start_date}}},
            {"$group": {
                "_id": {
                    "year": {"$year": "$operation_date"},
                    "month": {"$month": "$operation_date"}
                },
                "sales": {"$sum": {"$cond": [{"$eq": ["$type", "sale"]}, "$amount", 0]}},
                "purchases": {"$sum": {"$cond": [{"$eq": ["$type", "purchase"]}, "$amount", 0]}},
                "profit": {"$sum": {"$cond": [{"$eq": ["$type", "sale"]}, "$profit", 0]}}
            }}
        ]
        ops_results = await operations_collection.aggregate(ops_pipeline).to_list(length=13)
        ops_map = {f"{r['_id']['year']}-{r['_id']['month']}": r for r in ops_results}

        # Aggregate Expenses
        expenses_pipeline = [
            {"$match": {"admin_id": admin_id, "date": {"$gte": start_date}}},
            {"$group": {
                "_id": {
                    "year": {"$year": "$date"},
                    "month": {"$month": "$date"}
                },
                "total": {"$sum": "$amount"}
            }}
        ]
        expenses_results = await expenses_collection.aggregate(expenses_pipeline).to_list(length=13)
        expenses_map = {f"{r['_id']['year']}-{r['_id']['month']}": r["total"] for r in expenses_results}

        # Aggregate Completed Tasks
        tasks_pipeline = [
            {"$match": {"admin_id": admin_id, "status": "completed", "updated_at": {"$gte": start_date}}},
            {"$group": {
                "_id": {
                    "year": {"$year": "$updated_at"},
                    "month": {"$month": "$updated_at"}
                },
                "count": {"$sum": 1}
            }}
        ]
        tasks_results = await tasks_collection.aggregate(tasks_pipeline).to_list(length=13)
        tasks_map = {f"{r['_id']['year']}-{r['_id']['month']}": r["count"] for r in tasks_results}

        month_names_fr = [
            "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
            "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
        ]

        for i in range(11, -1, -1):
            # Logic to get year and month correctly
            current_month = now.month - i
            current_year = now.year
            while current_month <= 0:
                current_month += 12
                current_year -= 1
            
            key = f"{current_year}-{current_month}"
            op_data = ops_map.get(key, {})
            
            sales = op_data.get("sales", 0)
            purchases = op_data.get("purchases", 0)
            expenses = expenses_map.get(key, 0)
            profit = op_data.get("profit", 0)
            
            summaries.append(MonthlySummary(
                month_name=f"{month_names_fr[current_month-1]} {current_year}",
                month_key=key,
                sales=sales,
                purchases=purchases,
                expenses=expenses,
                profit=profit,
                net_profit=profit - expenses,
                tasks_completed=tasks_map.get(key, 0),
                global_balance=sales - purchases - expenses
            ))
        
        return summaries
