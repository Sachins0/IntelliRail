from ortools.sat.python import cp_model
from typing import List, Dict
from app.models.train import OptimizationRequest

PRIORITY_WEIGHT = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}

class SimpleRailwayOptimizer:
    print("SimpleRailwayOptimizer initialized")
    def __init__(self):
        self.model = None
        self.solver = None
    
    def optimize_simple(self, request: OptimizationRequest) -> Dict:
        """Simple optimization for 2-day demo"""
        try:
            self.model = cp_model.CpModel()
            
            trains = {t.id: t for t in request.trains}
            movements = request.movements
            
            # Decision variables: new departure times (in hours)
            departure_vars = {}
            platform_vars = {}
            
            for i, movement in enumerate(movements):
                # Departure time variable (8 AM to 6 PM = hours 8-18)
                departure_vars[i] = self.model.NewIntVar(
                    8, 18, f'departure_{i}'
                )
                
                # Platform assignment (1 to 3)
                platform_vars[i] = self.model.NewIntVar(
                    1, 3, f'platform_{i}'
                )
            
            # Constraint: No two trains on same platform at same time
            for i in range(len(movements)):
                for j in range(i + 1, len(movements)):
                    movement_i = movements[i]
                    movement_j = movements[j]
                    
                    # If same station, avoid platform conflicts
                    if movement_i.from_station == movement_j.from_station:
                        # Create boolean variable for same platform
                        same_platform = self.model.NewBoolVar(f'same_platform_{i}_{j}')
                        
                        # If same platform, ensure time separation
                        self.model.Add(platform_vars[i] == platform_vars[j]).OnlyEnforceIf(same_platform)
                        self.model.Add(platform_vars[i] != platform_vars[j]).OnlyEnforceIf(same_platform.Not())
                        
                        # Time separation constraint (at least 1 hour apart)
                        or_var1 = self.model.NewBoolVar(f'before_{i}_{j}')
                        or_var2 = self.model.NewBoolVar(f'after_{i}_{j}')
                        
                        self.model.Add(departure_vars[i] + 1 <= departure_vars[j]).OnlyEnforceIf([same_platform, or_var1])
                        self.model.Add(departure_vars[j] + 1 <= departure_vars[i]).OnlyEnforceIf([same_platform, or_var2])
                        self.model.Add(or_var1 + or_var2 >= 1).OnlyEnforceIf(same_platform)
            
            # Objective: Minimize total delays
            delay_terms = []
            for i, movement in enumerate(movements):
                train = trains[movement.train_id]
                scheduled_hour = movement.scheduled_departure_hour
                
                # Calculate delay
                delay = departure_vars[i] - scheduled_hour
                weight = PRIORITY_WEIGHT.get(train.priority, 2)  # Higher priority = higher weight
                delay_terms.append(weight * delay)
            
            self.model.Minimize(sum(delay_terms))
            
            # Solve
            solver = cp_model.CpSolver()
            solver.parameters.max_time_in_seconds = 10.0  # Quick solve for demo
            
            status = solver.Solve(self.model)
            
            if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
                # Extract solution
                optimized_movements = []
                total_delay_before = sum(m.delay_minutes for m in movements)
                print("total delay befor", total_delay_before)
                total_delay_after = 0
                
                for i, movement in enumerate(movements):
                    new_departure = solver.Value(departure_vars[i])
                    new_platform = solver.Value(platform_vars[i])
                    
                    # Calculate new delay
                    original_delay = movement.delay_minutes
                    schedule_diff = new_departure - movement.scheduled_departure_hour
                    new_delay = max(0, original_delay + (schedule_diff * 60))  # Convert to minutes
                    total_delay_after += new_delay
                    
                    optimized_movement = {
                        "train_id": movement.train_id,
                        "from_station": movement.from_station,
                        "to_station": movement.to_station,
                        "original_departure": movement.scheduled_departure_hour,
                        "optimized_departure": new_departure,
                        "original_platform": movement.platform,
                        "optimized_platform": new_platform,
                        "original_delay": original_delay,
                        "optimized_delay": new_delay
                    }
                    optimized_movements.append(optimized_movement)
                
                improvement = ((total_delay_before - total_delay_after) / max(total_delay_before, 1)) * 100
                
                return {
                    "status": "success",
                    "objective_value": solver.ObjectiveValue(),
                    "movements": optimized_movements,
                    "metrics": {
                        "total_delay_before": total_delay_before,
                        "total_delay_after": total_delay_after,
                        "improvement_percent": round(improvement, 1),
                        "conflicts_resolved": len([m for m in optimized_movements if m["optimized_platform"] != m["original_platform"]])
                    }
                }
            else:
                return {"status": "failed", "message": "No solution found"}
                
        except Exception as e:
            return {"status": "error", "message": str(e)}
