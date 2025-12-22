from app.db.mongo import operations_collection, expenses_collection, tasks_collection
from app.schemas.analytics import DailyStats, MonthlyStats, DailyOverview
from datetime import datetime, timedelta
from typing import List

class AnalyticsService:
    @staticmethod
    async def get_daily_overview(admin_id: str) -> DailyOverview:
        today = datetime.utcnow().date()
        start_of_day = datetime(today.year, today.month, today.day)
        end_of_day = start_of_day + timedelta(days=1)
        
        # Sales today
        sales_pipeline = [
            {"$match": {"admin_id": admin_id, "type": "sale", "operation_date": {"$gte": start_of_day, "$lt": end_of_day}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}, "profit": {"$sum": "$profit"}}}
        ]
        sales_result = await operations_collection.aggregate(sales_pipeline).to_list(length=1)
        sales = sales_result[0]["total"] if sales_result else 0
        operational_profit = sales_result[0]["profit"] if sales_result else 0
        
        # Purchases today
        purchases_pipeline = [
            {"$match": {"admin_id": admin_id, "type": "purchase", "operation_date": {"$gte": start_of_day, "$lt": end_of_day}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        purchases_result = await operations_collection.aggregate(purchases_pipeline).to_list(length=1)
        purchases = purchases_result[0]["total"] if purchases_result else 0

        # Expenses today
        expenses_pipeline = [
            {"$match": {"admin_id": admin_id, "date": {"$gte": start_of_day, "$lt": end_of_day}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        expenses_result = await expenses_collection.aggregate(expenses_pipeline).to_list(length=1)
        expenses = expenses_result[0]["total"] if expenses_result else 0
        
        # Global Balance = sales - purchases - expenses
        global_balance = sales - purchases - expenses
        # Net Profit here could be operational_profit - expenses
        net_profit = operational_profit - expenses
        
        # Tasks
        new_tasks = await tasks_collection.count_documents({
            "admin_id": admin_id,
            "created_at": {"$gte": start_of_day, "$lt": end_of_day}
        })

        completed_tasks = await tasks_collection.count_documents({
            "admin_id": admin_id,
            "status": "completed",
            "updated_at": {"$gte": start_of_day, "$lt": end_of_day}
        })
        
        # Total Stock Value
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
            global_balance=global_balance,
            profit=operational_profit,
            expenses=expenses,
            net_profit=net_profit,
            new_tasks=new_tasks,
            completed_tasks=completed_tasks,
            total_value=total_stock_value
        )

    @staticmethod
    async def get_monthly_stats(admin_id: str) -> MonthlyStats:
        now = datetime.utcnow()
        start_of_month = datetime(now.year, now.month, 1)
        
        # Total sales & profit
        sales_pipeline = [
            {"$match": {"admin_id": admin_id, "type": "sale", "operation_date": {"$gte": start_of_month}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}, "profit": {"$sum": "$profit"}}}
        ]
        sales_result = await operations_collection.aggregate(sales_pipeline).to_list(length=1)
        total_sales = sales_result[0]["total"] if sales_result else 0
        total_operational_profit = sales_result[0]["profit"] if sales_result else 0
        
        # Total purchases
        purchases_pipeline = [
            {"$match": {"admin_id": admin_id, "type": "purchase", "operation_date": {"$gte": start_of_month}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        purchases_result = await operations_collection.aggregate(purchases_pipeline).to_list(length=1)
        total_purchases = purchases_result[0]["total"] if purchases_result else 0

        # Total expenses
        expenses_pipeline = [
            {"$match": {"admin_id": admin_id, "date": {"$gte": start_of_month}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        expenses_result = await expenses_collection.aggregate(expenses_pipeline).to_list(length=1)
        total_expenses = expenses_result[0]["total"] if expenses_result else 0
        
        global_balance = total_sales - total_purchases - total_expenses
        net_profit = total_operational_profit - total_expenses
        
        # Tasks - filtered by updated_at for status transitions this month
        total_tasks = await tasks_collection.count_documents({"admin_id": admin_id, "created_at": {"$gte": start_of_month}})
        completed_tasks = await tasks_collection.count_documents({
            "admin_id": admin_id,
            "status": "completed",
            "updated_at": {"$gte": start_of_month}
        })
        in_progress_tasks = await tasks_collection.count_documents({
            "admin_id": admin_id,
            "status": {"$in": ["in_progress", "in_delivery"]},
            "updated_at": {"$gte": start_of_month}
        })
        cancelled_tasks = await tasks_collection.count_documents({
            "admin_id": admin_id,
            "status": "cancelled",
            "updated_at": {"$gte": start_of_month}
        })

        # Calculate Total Stock Value
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
            global_balance=global_balance,
            total_profit=total_operational_profit,
            total_expenses=total_expenses,
            net_profit=net_profit,
            total_tasks=total_tasks,
            completed_tasks=completed_tasks,
            in_progress_tasks=in_progress_tasks,
            cancelled_tasks=cancelled_tasks,
            total_value=total_stock_value
        )

    @staticmethod
    async def get_weekly_stats(admin_id: str) -> List[DailyStats]:
        now = datetime.utcnow()
        start_of_week = now - timedelta(days=7)
        
        stats = []
        for i in range(7):
            date = (start_of_week + timedelta(days=i)).date()
            start_of_day = datetime(date.year, date.month, date.day)
            end_of_day = start_of_day + timedelta(days=1)
            
            # Sales
            sales_pipeline = [
                {"$match": {"admin_id": admin_id, "type": "sale", "operation_date": {"$gte": start_of_day, "$lt": end_of_day}}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}, "profit": {"$sum": "$profit"}}}
            ]
            sales_result = await operations_collection.aggregate(sales_pipeline).to_list(length=1)
            sales = sales_result[0]["total"] if sales_result else 0
            operational_profit = sales_result[0]["profit"] if sales_result else 0

            # Purchases
            purchases_pipeline = [
                {"$match": {"admin_id": admin_id, "type": "purchase", "operation_date": {"$gte": start_of_day, "$lt": end_of_day}}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]
            purchases_result = await operations_collection.aggregate(purchases_pipeline).to_list(length=1)
            purchases = purchases_result[0]["total"] if purchases_result else 0
            
            # Tasks
            tasks = await tasks_collection.count_documents({
                "admin_id": admin_id,
                "created_at": {"$gte": start_of_day, "$lt": end_of_day}
            })
            
            # Expenses
            expenses_pipeline = [
                {"$match": {"admin_id": admin_id, "date": {"$gte": start_of_day, "$lt": end_of_day}}},
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
            ]
            expenses_result = await expenses_collection.aggregate(expenses_pipeline).to_list(length=1)
            expenses = expenses_result[0]["total"] if expenses_result else 0
            
            stats.append(DailyStats(
                date=date.isoformat(),
                sales=sales,
                purchases=purchases,
                profit=operational_profit,
                tasks=tasks,
                expenses=expenses
            ))
        
        return stats

    @staticmethod
    async def get_treasury_report(admin_id: str, start_date: datetime, end_date: datetime):
        # Sales & Operational Profit
        sales_pipeline = [
            {"$match": {"admin_id": admin_id, "type": "sale", "operation_date": {"$gte": start_date, "$lt": end_date}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}, "profit": {"$sum": "$profit"}, "count": {"$sum": 1}}}
        ]
        sales_result = await operations_collection.aggregate(sales_pipeline).to_list(length=1)
        total_sales = sales_result[0]["total"] if sales_result else 0
        total_profit = sales_result[0]["profit"] if sales_result else 0
        sales_count = sales_result[0]["count"] if sales_result else 0

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
            }
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

            <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #666;">
                Document généré le {datetime.utcnow().strftime('%d/%m/%Y %H:%M:%S')}
            </div>
        </body>
        </html>
        """
        
        pdf_buffer = BytesIO()
        pisa.CreatePDF(html_content, dest=pdf_buffer)
        return pdf_buffer.getvalue()
