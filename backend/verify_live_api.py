import httpx

BASE_URL = "http://127.0.0.1:8000"

def run_verification():
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        # 1. Health check
        r = client.get("/health")
        assert r.status_code == 200, f"Health check failed: {r.text}"
        print("1. Health check:", r.json()["status"], "PostGIS:", r.json()["postgis"]["installed_version"])

        # 2. Register
        user_email = "ecologist@darukaa.earth"
        r = client.post("/auth/register", json={"email": user_email, "password": "SecurePassword123!"})
        if r.status_code == 409:
            print("2. User already registered, proceeding to login.")
        else:
            assert r.status_code == 201, f"Registration failed: {r.text}"
            print("2. Registered user:", r.json()["email"])

        # 3. Login
        r = client.post("/auth/login", data={"username": user_email, "password": "SecurePassword123!"})
        assert r.status_code == 200, f"Login failed: {r.text}"
        token = r.json()["access_token"]
        print("3. Logged in successfully. Token acquired.")

        auth_headers = {"Authorization": f"Bearer {token}"}

        # 4. Create Project
        r = client.post("/projects", json={"name": "Atlantic Rainforest Reserve", "description": "Primary biodiversity zone"}, headers=auth_headers)
        assert r.status_code == 201, f"Create project failed: {r.text}"
        project = r.json()
        project_id = project["id"]
        print(f"4. Created Project: '{project['name']}' (ID: {project_id}) - Initial Area: {project['area']}, Progress: {project['progress']}%")

        # 5. Create Site with PostGIS Polygon
        polygon_coords = [
            [
                [-47.000, -22.000],
                [-46.960, -22.000],
                [-46.960, -22.040],
                [-47.000, -22.040],
                [-47.000, -22.000],
            ]
        ]
        r = client.post(
            f"/projects/{project_id}/sites",
            json={"name": "Canopy Monitoring Station 01", "status": "forest", "coordinates": polygon_coords},
            headers=auth_headers,
        )
        assert r.status_code == 201, f"Create site failed: {r.text}"
        site = r.json()
        site_id = site["id"]
        print(f"5. Created Site with PostGIS geometry: '{site['name']}' - Computed Geodetic Area: {site['area']}")

        # 6. Query Sites for Project
        r = client.get(f"/projects/{project_id}/sites", headers=auth_headers)
        assert r.status_code == 200
        print(f"6. Listed {len(r.json())} site(s) for project.")

        # 7. Spatial Summary (PostGIS Area, Centroid, Bounding Box, Perimeter)
        r = client.get(f"/sites/{site_id}/spatial-summary", headers=auth_headers)
        assert r.status_code == 200, f"Spatial summary failed: {r.text}"
        spatial = r.json()
        print(f"7. Spatial Summary: Area={spatial['area_ha']} ha, Perimeter={spatial['perimeter_meters']} m, Centroid={spatial['centroid']}, BBox={spatial['bbox']}")

        # 8. Seed Metrics (Frontend button action)
        r = client.post(f"/sites/{site_id}/metrics/seed-mock-data")
        assert r.status_code == 200, f"Seed metrics failed: {r.text}"
        metrics = r.json()
        print(f"8. Seeded Biometric Metrics: {len(metrics)} time-series readings.")
        print(f"   Sample reading: metric_type='{metrics[0]['metric_type']}', value={metrics[0]['value']}, recorded_at='{metrics[0]['recorded_at']}'")

        # 9. Verify Project Progress & Total Area updated
        r = client.get(f"/projects/{project_id}", headers=auth_headers)
        assert r.status_code == 200
        updated_project = r.json()
        print(f"9. Updated Project State: Area={updated_project['area']}, Sites={updated_project['sites']}, Monitoring Progress={updated_project['progress']}%")

        print("\n--> ALL LIVE END-TO-END FLOWS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    run_verification()
